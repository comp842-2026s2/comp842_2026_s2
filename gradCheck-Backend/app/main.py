"""FastAPI app entry point for the gradCheck backend."""

import hashlib
import secrets
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf
from services.ipfs_client import upload_to_ipfs, download_from_ipfs
from services.certificate_repository import CertificateRepository
from services.student_repository import StudentRepository
from services.degree_repository import DegreeRepository
from services.login_repository import LoginRepository
from services.staff_repository import StaffRepository
from services.verification_link_repository import VerificationLinkRepository
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    LOGIN_TYPE_STUDENT,
    LOGIN_TYPE_ADMIN,
)

app = FastAPI()
registration_repo = CertificateRepository()
student_repo = StudentRepository()
degree_repo = DegreeRepository()
login_repo = LoginRepository()
staff_repo = StaffRepository()
verification_link_repo = VerificationLinkRepository()
bearer_scheme = HTTPBearer()

# Allow the React dev server (Vite, usually localhost:5173) to call this API
# from the browser. Without this, the browser blocks every request with a
# CORS error before it even reaches these endpoints.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "gradCheck backend is running"}


@app.get("/degrees")
def list_degrees():
    """List all active degrees. Backend for the Registration page's degree
    dropdown — Frontend calls this to populate the list of options."""
    return degree_repo.get_all()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """Decode and validate the JWT sent as 'Authorization: Bearer <token>'.
    Raises 401 if the header is missing, the token is invalid, or expired."""
    try:
        return decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_admin(user: dict = Depends(get_current_user)):
    """Same as get_current_user, but also requires an admin login_type."""
    if user.get("login_type") != LOGIN_TYPE_ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_super_admin(user: dict = Depends(require_admin)):
    """Same as require_admin, but further restricted to the single fixed
    "admin" account (login_id == "admin") — not just any staff/admin
    login_type. There's no separate role/tier column for this yet; the
    fixed account is what the team decided on, per Aung: only the "admin"
    account should be able to create new staff, not staff creating staff."""
    if user.get("sub") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only the admin account can register new staff",
        )
    return user


def require_self_or_admin(studentid: str, user: dict = Depends(get_current_user)):
    """For the /students/{studentid}/... student-module endpoints: allows
    either the student themselves (their token's login_id == studentid) or
    any admin/staff token — so one student can't read another student's
    data, but staff can look up anyone."""
    if user.get("login_type") == LOGIN_TYPE_ADMIN or user.get("sub") == studentid:
        return user
    raise HTTPException(status_code=403, detail="Not authorized for this student")


class LoginRequest(BaseModel):
    login_id: str
    login_password: str


@app.post("/login")
def login(payload: LoginRequest):
    """Authenticate against login_info and issue a JWT. Frontend sends this
    token back as 'Authorization: Bearer <token>' on protected endpoints."""
    user = login_repo.get_by_login_id(payload.login_id)
    if user is None or not verify_password(payload.login_password, user["login_password"]):
        raise HTTPException(status_code=401, detail="Invalid login_id or password")

    token = create_access_token(login_id=user["login_id"], login_type=user["login_type"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "login_type": user["login_type"],
        # So the Frontend knows "who am I" without decoding the JWT itself —
        # needed to build /students/{login_id}/... URLs after login.
        "login_id": user["login_id"],
    }


class LoginRegisterRequest(BaseModel):
    login_id: str
    login_password: str
    login_type: int = LOGIN_TYPE_STUDENT


@app.post("/login/register")
def register_login(payload: LoginRegisterRequest, admin: dict = Depends(require_super_admin)):
    """Create a new login_info account (student or admin/staff). Only the
    "admin" account can call this (not just any staff account) — this
    replaces manually INSERT-ing a bcrypt hash via Workbench. The password
    is hashed here; it's never stored in plaintext and this endpoint never
    returns it back."""
    if payload.login_type not in (LOGIN_TYPE_STUDENT, LOGIN_TYPE_ADMIN):
        raise HTTPException(status_code=400, detail="login_type must be 1 (student) or 2 (admin/staff)")

    try:
        new_id = login_repo.create(
            login_id=payload.login_id,
            hashed_password=hash_password(payload.login_password),
            login_type=payload.login_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"id": new_id, "login_id": payload.login_id, "login_type": payload.login_type}


@app.get("/students")
def list_all_students(user: dict = Depends(get_current_user)):
    """Return every registered student, regardless of status. Requires a
    valid login token (any login_type) — for an admin/staff dashboard view."""
    return registration_repo.get_all()


class StaffRequest(BaseModel):
    staff_id: str
    full_name: str
    email: str


class StaffUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    active: Optional[bool] = None


@app.get("/staff")
def list_all_staff(admin: dict = Depends(require_admin)):
    """Return every staff row. Admin only (login_type 2 covers both admin
    and staff accounts — there's no separate staff login_type)."""
    return staff_repo.get_all()


@app.post("/staff")
def add_staff(payload: StaffRequest, admin: dict = Depends(require_super_admin)):
    """Register a new staff member. Only the "admin" account can do this —
    a regular staff account cannot register other staff."""
    try:
        new_id = staff_repo.create(
            staff_id=payload.staff_id,
            full_name=payload.full_name,
            email=payload.email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return staff_repo.get_by_id(new_id)


@app.put("/staff/{staff_row_id}")
def update_staff(staff_row_id: int, payload: StaffUpdateRequest, admin: dict = Depends(require_admin)):
    """Update a staff row's name/email, or activate/deactivate it (set
    active: false instead of deleting). Only the fields you send are
    changed. Admin only."""
    updated = staff_repo.update(
        staff_row_id,
        full_name=payload.full_name,
        email=payload.email,
        active=payload.active,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Staff not found")

    return staff_repo.get_by_id(staff_row_id)


class RegistrationRequest(BaseModel):
    student_id: str
    student_name: str
    degree_id: int
    wallet_address: str
    conferral_date: date
    student_password: Optional[str] = None


@app.post("/register")
def register_student(payload: RegistrationRequest):
    """Register a new student for graduation. Backend for the
    'Registration' page — Frontend calls this when the form is submitted.

    Public/no login required (2026-09-19 — was admin-only) so a student can
    self-register instead of a staff member creating every account by hand.
    Staff can still use this same endpoint on a student's behalf if needed.

    If student_password is provided, a login_info account is created for
    the student in the same call (login_id = student_id, login_type =
    student), so they can log in right away — no separate
    /login/register call needed.

    A student can hold more than one degree — the `students` row (personal
    info) is shared across all of them, so it's created once (or reused if
    it already exists) and this call's degree/wallet/conferral details go
    into their own `certificates` row."""
    if payload.student_password and login_repo.get_by_login_id(payload.student_id) is not None:
        raise HTTPException(status_code=400, detail=f"login_id {payload.student_id} is already taken")

    student_repo.get_or_create(payload.student_id, payload.student_name)

    try:
        new_id = registration_repo.create(
            student_id=payload.student_id,
            degree_id=payload.degree_id,
            wallet_address=payload.wallet_address,
            conferral_date=payload.conferral_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    login_created = False
    if payload.student_password:
        try:
            login_repo.create(
                login_id=payload.student_id,
                hashed_password=hash_password(payload.student_password),
                login_type=LOGIN_TYPE_STUDENT,
            )
            login_created = True
        except ValueError:
            # Lost a race against another request creating the same
            # login_id between our check above and this insert — the
            # registration itself still succeeded.
            login_created = False

    return {"registration_id": new_id, "status": "registered", "login_created": login_created}


def _pending_release_view(row):
    """Same 'hide details before conferral_date' shape /verify uses —
    reused by the student's own certificate view too, so a pre-generated
    certificate doesn't leak its hash/CID before it's officially conferred.

    Copies the whole row and only blanks out the proof-of-existence fields
    (pdf_hash/ipfs_cid/token_id/mint_tx_hash/minted_at) — everything else
    (certificate_id, university_name, wallet_address, registered_at, ...)
    passes through untouched, so this doesn't silently drop fields if the
    repository's row shape grows again later."""
    if row["conferral_date"] > date.today():
        hidden = dict(row)
        hidden["status"] = "pending_release"
        for field in ("pdf_hash", "ipfs_cid", "token_id", "mint_tx_hash", "minted_at"):
            hidden[field] = None
        return hidden
    return row


@app.get("/verify/{registration_id}")
def verify_certificate(registration_id: int):
    """Public verification lookup. Backend for the 'Verify Certificate'
    page — anyone with the link can check a certificate's authenticity.

    The certificate can be prepared (PDF generated, hashed, uploaded to
    IPFS) ahead of the graduation date, but its hash/CID/mint details stay
    hidden from this public endpoint until that date arrives — it's not
    officially released before then."""
    result = registration_repo.get_by_id(registration_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Registration not found")

    return _pending_release_view(result)


@app.get("/students/{studentid}")
def get_student_profile(studentid: str, user: dict = Depends(require_self_or_admin)):
    """Return this student's own registration(s) — their profile info for
    the student module's dashboard. A student can have more than one row
    (one per degree they registered for). Self token or admin token only."""
    rows = registration_repo.get_by_student_id(studentid)
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")
    return rows


@app.get("/students/{studentid}/certificate")
def get_student_certificates(studentid: str, user: dict = Depends(require_self_or_admin)):
    """Return certificate status/info for every one of this student's
    registrations. Self token or admin token only — same pending_release
    hiding as the public /verify endpoint applies here too."""
    rows = registration_repo.get_by_student_id(studentid)
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")
    return [_pending_release_view(row) for row in rows]


@app.get("/students/{studentid}/certificate/download")
def download_student_certificate(
    studentid: str,
    registration_id: Optional[int] = None,
    user: dict = Depends(require_self_or_admin),
):
    """Download the issued certificate PDF (fetched back from IPFS).
    If this student has more than one registration (multiple degrees),
    pass ?registration_id=... to pick which one — required in that case."""
    rows = registration_repo.get_by_student_id(studentid)
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")

    if registration_id is not None:
        row = next((r for r in rows if r["id"] == registration_id), None)
        if row is None:
            raise HTTPException(status_code=404, detail="registration_id does not belong to this student")
    elif len(rows) == 1:
        row = rows[0]
    else:
        raise HTTPException(
            status_code=400,
            detail="This student has multiple registrations — pass ?registration_id=... to pick one",
        )

    if row["conferral_date"] > date.today():
        raise HTTPException(status_code=403, detail="Certificate isn't released yet (conferral date hasn't arrived)")

    if not row["ipfs_cid"]:
        raise HTTPException(status_code=400, detail="Certificate PDF hasn't been generated yet")

    pdf_bytes = download_from_ipfs(row["ipfs_cid"])
    filename = f"{row['student_id']}_certificate.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class VerificationLinkRequest(BaseModel):
    registration_id: int
    expires_in_days: int = 7


@app.get("/students/{studentid}/verification-links")
def list_verification_links(studentid: str, user: dict = Depends(require_self_or_admin)):
    """List every verification link generated across this student's
    registrations (doesn't expose the raw token — only /login/register-
    style metadata: id, expiry, revoked). Self token or admin token only."""
    rows = registration_repo.get_by_student_id(studentid)
    registration_ids = [r["id"] for r in rows]
    return verification_link_repo.get_by_registration_ids(registration_ids)


@app.post("/students/{studentid}/verification-links")
def create_verification_link(
    studentid: str, payload: VerificationLinkRequest, user: dict = Depends(require_self_or_admin)
):
    """Generate a new temporary, shareable verification link for one of
    this student's registrations. Self token or admin token only.

    The raw token is returned here ONCE — only its SHA-256 hash is ever
    stored, so it can't be recovered later. Build the shareable link on
    the Frontend as <verify page>?token=<token>."""
    rows = registration_repo.get_by_student_id(studentid)
    if not any(r["id"] == payload.registration_id for r in rows):
        raise HTTPException(status_code=404, detail="registration_id does not belong to this student")

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(days=payload.expires_in_days)

    link_id = verification_link_repo.create(
        registration_id=payload.registration_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    return {"id": link_id, "token": token, "expires_at": expires_at}


@app.delete("/students/{studentid}/verification-links/{link_id}")
def revoke_verification_link(studentid: str, link_id: int, user: dict = Depends(require_self_or_admin)):
    """Revoke (deactivate) a verification link, e.g. once it's no longer
    needed or was shared by mistake. Self token or admin token only —
    enforced by confirming the link belongs to one of this student's own
    registrations before revoking it."""
    link = verification_link_repo.get_by_id(link_id)
    if link is None:
        raise HTTPException(status_code=404, detail="Verification link not found")

    rows = registration_repo.get_by_student_id(studentid)
    if not any(r["id"] == link["registration_id"] for r in rows):
        raise HTTPException(status_code=404, detail="Verification link not found")

    verification_link_repo.revoke(link_id)
    return {"id": link_id, "revoked": True}


@app.post("/generate-pdf")
def generate_pdf_batch(admin: dict = Depends(require_admin)):
    """Process every registration with status='registered':
    render its PDF, hash it, upload to IPFS, and write the results
    back to the database. Requires an admin login token."""
    students = registration_repo.get_registered()
    results = []

    for student in students:
        pdf_bytes = render_degree_pdf(
            registration_id=student["id"],
            student_id=student["student_id"],
            student_name=student["student_name"],
            degree_name=student["degree_name"],
            conferral_date=str(student["conferral_date"]),
        )
        pdf_hash = hash_pdf(pdf_bytes)
        cid = upload_to_ipfs(pdf_bytes, filename=f"{student['student_id']}.pdf")
        registration_repo.update_pdf_info(student["id"], pdf_hash, cid)

        results.append({
            "registration_id": student["id"],
            "student_id": student["student_id"],
            "pdf_hash": pdf_hash,
            "ipfs_cid": cid,
        })

    return {"processed": len(results), "results": results}


@app.post("/generate-token/{certificate_id}")
def generate_token(certificate_id: str, admin: dict = Depends(require_admin)):
    """Mint the Soulbound Token for one certificate. Keyed by
    certificate_id (not student_id) since a student can now hold several
    certificates — certificate_id is the one that's unambiguous.

    TODO(Han Zaw): this stubs the actual mint — it doesn't call the smart
    contract yet. Replace the block below with the real on-chain mint call
    (using wallet_address/ipfs_cid/pdf_hash from `certificate`), and use
    whatever token_id/tx hash it actually returns instead of the
    placeholders here. Everything else (lookup, status checks, DB update,
    response shape) should stay the same so the Frontend doesn't need to
    change once this is wired up for real.
    """
    certificate = registration_repo.get_by_certificate_id(certificate_id)
    if certificate is None:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if certificate["status"] == "minted":
        raise HTTPException(status_code=400, detail="Certificate already minted")
    if certificate["status"] != "pdf_generated":
        raise HTTPException(
            status_code=400,
            detail="PDF must be generated before minting a token",
        )

    # --- stub start (swap for the real contract call) ---
    token_id = certificate["id"]
    mint_tx_hash = "0x" + secrets.token_hex(32)
    # --- stub end ---

    registration_repo.update_mint_info(certificate_id, token_id, mint_tx_hash)
    return registration_repo.get_by_certificate_id(certificate_id)
