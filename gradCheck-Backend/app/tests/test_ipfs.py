"""Quick manual test — run with `python3 -m tests.test_ipfs` from the app/ folder."""

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf
from services.ipfs_client import upload_to_ipfs

pdf_bytes = render_degree_pdf(
    registration_id=1,
    student_id="S1001",
    student_name="Han Zaw",
    degree_name="Bachelor of Computer Science",
    conferral_date="15 December 2026",
)

pdf_hash = hash_pdf(pdf_bytes)
cid = upload_to_ipfs(pdf_bytes, filename="test_degree.pdf")

print(f"PDF hash: {pdf_hash}")
print(f"IPFS CID: {cid}")