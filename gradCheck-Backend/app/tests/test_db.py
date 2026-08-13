"""Quick manual test — run with `python3 -m tests.test_db` from the app/ folder."""

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf
from services.ipfs_client import upload_to_ipfs
from services.db_client import mark_pdf_generated

REGISTRATION_ID = 1  # S1001, Han Zaw — matches the dummy row in the DB

pdf_bytes = render_degree_pdf(
    registration_id=REGISTRATION_ID,
    student_id="S1001",
    student_name="Han Zaw",
    degree_name="Bachelor of Computer Science",
    conferral_date="15 December 2026",
)

pdf_hash = hash_pdf(pdf_bytes)
cid = upload_to_ipfs(pdf_bytes, filename="test_degree.pdf")

mark_pdf_generated(REGISTRATION_ID, pdf_hash, cid)

print(f"PDF hash: {pdf_hash}")
print(f"IPFS CID: {cid}")
print(f"Registration {REGISTRATION_ID} updated in DB — check MySQL Workbench.")