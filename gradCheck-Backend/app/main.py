"""FastAPI app entry point for the gradCheck backend."""

from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf
from services.ipfs_client import upload_to_ipfs
from services.registration_repository import RegistrationRepository
from services.degree_repository import DegreeRepository

app = FastAPI()
registration_repo = RegistrationRepository()
degree_repo = DegreeRepository()

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


class RegistrationRequest(BaseModel):
    student_id: str
    student_name: str
    degree_id: int
    wallet_address: str
    conferral_date: date


@app.post("/register")
def register_student(payload: RegistrationRequest):
    """Register a new student for graduation. Backend for the
    'Registration' page — Frontend calls this when the form is submitted."""
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

    return {"registration_id": new_id, "status": "registered"}


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
def generate_pdf_batch():
    """Process every registration with status='registered':
    render its PDF, hash it, upload to IPFS, and write the results
    back to the database."""
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
