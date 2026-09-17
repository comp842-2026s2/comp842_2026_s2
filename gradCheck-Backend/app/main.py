"""FastAPI app entry point for the gradCheck backend."""

from datetime import date
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf
from services.ipfs_client import upload_to_ipfs
from services.registration_repository import RegistrationRepository
from services.degree_repository import DegreeRepository
from services.login_repository import LoginRepository
from services.staff_repository import StaffRepository
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    LOGIN_TYPE_STUDENT,
    LOGIN_TYPE_ADMIN,
)

app = FastAPI()
registration_repo = RegistrationRepository()
degree_repo = DegreeRepository()
login_repo = LoginRepository()
staff_repo = StaffRepository()
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
    return {"access_token": token, "token_type": "bearer", "login_type": user["login_type"]}


class LoginRegisterRequest(BaseModel):
    login_id: str
    login_password: str
    login_type: int = LOGIN_TYPE_STUDENT


@app.post("/login/register")
def register_login(payload: LoginRegisterRequest, admin: dict = Depends(require_admin)):
    """Create a new login_info account (student or admin/staff). Admin
    token required — this replaces manually INSERT-ing a bcrypt hash via
    Workbench. The password is hashed here; it's never stored in plaintext
    and this endpoint never returns it back."""
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
def add_staff(payload: StaffRequest, admin: dict = Depends(require_admin)):
    """Register a new staff member. Admin only."""
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
def register_student(payload: RegistrationRequest, admin: dict = Depends(require_admin)):
    """Register a new student for graduation. Backend for the
    'Registration' page — Frontend calls this when the form is submitted.
    Requires an admin login token.

    If student_password is provided, a login_info account is created for
    the student in the same call (login_id = student_id, login_type =
    student), so they can log in right away — no separate
    /login/register call needed."""
    if payload.student_password and login_repo.get_by_login_id(payload.student_id) is not None:
        raise HTTPException(status_code=400, detail=f"login_id {payload.student_id} is already taken")

    try:
        new_id = registration_repo.create(
            student_id=payload.student_id,
            student_name=payload.student_name,
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

    if result["conferral_date"] > date.today():
        return {
            "id": result["id"],
            "student_id": result["student_id"],
            "student_name": result["student_name"],
            "degree_name": result["degree_name"],
            "conferral_date": result["conferral_date"],
            "status": "pending_release",
            "pdf_hash": None,
            "ipfs_cid": None,
            "token_id": None,
            "mint_tx_hash": None,
            "minted_at": None,
        }

    return result


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
