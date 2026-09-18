import hashlib
import os

import requests
from dotenv import load_dotenv

load_dotenv()

PINATA_JWT = os.environ.get("PINATA_JWT", "")
PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
IPFS_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs/{cid}"


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
