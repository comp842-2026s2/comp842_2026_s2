import hashlib


def hash_pdf(pdf_bytes: bytes) -> str:
    """Return the sha256 hash of the given PDF bytes, as "0x" + hex."""
    digest = hashlib.sha256(pdf_bytes).hexdigest()
    return "0x" + digest
