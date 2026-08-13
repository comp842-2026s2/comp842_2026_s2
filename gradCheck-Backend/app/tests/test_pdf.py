"""Quick manual test — run with `python3 -m tests.test_pdf` from the app/ folder."""

from pathlib import Path

from services.pdf_generator import render_degree_pdf
from services.hasher import hash_pdf

pdf_bytes = render_degree_pdf(
    registration_id=1,
    student_id="S1001",
    student_name="Han Zaw",
    degree_name="Bachelor of Computer Science",
    conferral_date="15 December 2026",
)

output_dir = Path("outPut")
output_dir.mkdir(exist_ok=True)
output_path = output_dir / "test_output.pdf"

with open(output_path, "wb") as f:
    f.write(pdf_bytes)

pdf_hash = hash_pdf(pdf_bytes)

print(f"PDF generated successfully — {len(pdf_bytes)} bytes written to {output_path}")
print(f"PDF hash: {pdf_hash}")
print(f"Hash length: {len(pdf_hash)} characters (should be 66)")
