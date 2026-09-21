import hashlib
import os

import requests
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

PDF_ENCRYPTION_KEY = os.environ["PDF_ENCRYPTION_KEY"]
_fernet = Fernet(PDF_ENCRYPTION_KEY.encode() if isinstance(PDF_ENCRYPTION_KEY, str) else PDF_ENCRYPTION_KEY)

PINATA_JWT = os.environ.get("PINATA_JWT", "")
PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
IPFS_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs/{cid}"

PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"


def upload_json_to_ipfs(metadata: dict) -> str:
    """Pin a JSON object (the NFT-style wallet-display metadata) to Pinata
    and return the resulting CID. Same DRY RUN fallback as upload_to_ipfs,
    so this is testable without real Pinata credentials configured."""
    if not PINATA_JWT:
        fake_cid = "bafy" + hashlib.sha256(str(metadata).encode()).hexdigest()[:44]
        print(f"[DRY RUN] No Pinata credentials — returning fake CID: {fake_cid}")
        return fake_cid

    headers = {"Authorization": f"Bearer {PINATA_JWT}"}
    response = requests.post(PINATA_JSON_URL, json={"pinataContent": metadata}, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()["IpfsHash"]


def upload_to_ipfs(pdf_bytes: bytes, filename: str = "degree.pdf") -> str:
    """Upload PDF bytes to Pinata and return the resulting CID.

    Falls back to a deterministic fake CID when no PINATA_JWT is
    configured, so the pipeline is testable without a real account.
    """
    if not PINATA_JWT:
        fake_cid = "bafy" + hashlib.sha256(pdf_bytes).hexdigest()[:44]
        print(f"[DRY RUN] No Pinata credentials — returning fake CID: {fake_cid}")
        return fake_cid

    headers = {"Authorization": f"Bearer {PINATA_JWT}"}
    files = {"file": (filename, pdf_bytes, "application/pdf")}
    response = requests.post(PINATA_UPLOAD_URL, files=files, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()["IpfsHash"]


def download_from_ipfs(cid: str) -> bytes:
    """Fetch the PDF bytes for a CID back from IPFS (via Pinata's public
    gateway), for the certificate download endpoint. Raises
    requests.HTTPError if the CID can't be fetched (e.g. a fake CID from a
    DRY RUN upload, since there's nothing real on IPFS to fetch)."""
    response = requests.get(IPFS_GATEWAY_URL.format(cid=cid), timeout=30)
    response.raise_for_status()
    return response.content

def encrypt_pdf(pdf_bytes: bytes) -> bytes:
    """Encrypts the raw PDF bytes before they ever get pinned to IPFS."""
    return _fernet.encrypt(pdf_bytes)


def decrypt_pdf(ciphertext: bytes) -> bytes:
    """Reverses encrypt_pdf — used right after pulling the file back from IPFS."""
    return _fernet.decrypt(ciphertext)