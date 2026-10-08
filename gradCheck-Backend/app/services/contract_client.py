import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3
from datetime import datetime, timezone

load_dotenv()

_DEFAULT_MINT_LOG_FILE = Path(__file__).resolve().parents[2] / "logs" / "minting.log"
_MINT_LOG_FILE = Path(os.getenv("MINT_LOG_FILE", _DEFAULT_MINT_LOG_FILE))


class _MintLogFormatter(logging.Formatter):
    """Format mint audit records as one JSON object per line."""

    def format(self, record):
        return json.dumps(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "credential_mint",
                **record.mint_record,
            },
            default=str,
        )


def _get_mint_logger():
    logger = logging.getLogger(__name__)
    if not logger.handlers:
        _MINT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        handler = logging.FileHandler(_MINT_LOG_FILE, encoding="utf-8")
        handler.setFormatter(_MintLogFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


mint_logger = _get_mint_logger()

API_URL = os.environ["API_URL"]
PRIVATE_KEY = os.environ["PRIVATE_KEY"]
CONTRACT_ADDRESS = Web3.to_checksum_address(os.environ["CONTRACT_ADDRESS"])

with open(Path(__file__).parent / "contract_abi.json") as f:
    CONTRACT_ABI = json.load(f)

w3 = Web3(Web3.HTTPProvider(API_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


def mint_credential(wallet_address, token_uri, document_hash, student_name, degree_name, graduation_date_epoch, document_cid):
    """Signs and sends mint() from the university's minter wallet. Returns {txHash, tokenId}."""
    request_data = {
        "walletAddress": wallet_address,
        "tokenURI": token_uri,
        "documentHash": document_hash,
        "studentName": student_name,
        "degreeName": degree_name,
        "graduationDateEpoch": graduation_date_epoch,
        "documentCID": document_cid,
    }

    try:
        tx = contract.functions.mint(
            Web3.to_checksum_address(wallet_address),
            token_uri,
            Web3.to_bytes(hexstr=document_hash),
            student_name,
            degree_name,
            graduation_date_epoch,
            document_cid,
        ).build_transaction({
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 3_000_000,
            "gasPrice": w3.eth.gas_price,
        })

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        minted = contract.events.CredentialMinted().process_receipt(receipt)
        token_id = minted[0]["args"]["tokenId"] if minted else None
        result = {"txHash": tx_hash.hex(), "tokenId": token_id}

        mint_logger.info(
            "Mint completed",
            extra={
                "mint_record": {
                    "status": "success" if receipt["status"] == 1 else "failed",
                    "request": request_data,
                    "response": {
                        **result,
                        "receiptStatus": receipt["status"],
                    },
                }
            },
        )
        return result
    except Exception as error:
        mint_logger.error(
            "Mint failed",
            extra={
                "mint_record": {
                    "status": "failed",
                    "request": request_data,
                    "response": None,
                    "error": {
                        "type": type(error).__name__,
                        "message": str(error),
                    },
                }
            },
        )
        raise


def verify_credential_by_hash(document_hash: str):
    """Looks up a credential by its document hash (the same "0x"+hex
    string hash_pdf() returns) via the contract's verifyByHash(), then —
    if a matching token exists — fetches its full on-chain metadata via
    getCredential(). Returns None if no token was ever minted against
    this exact hash.

    Returns:
        {
            "tokenId": int,
            "studentName": str,
            "degreeName": str,
            "graduationDate": int,   # epoch seconds
            "documentCID": str,
            "documentHash": str,    # "0x" + hex, 32 bytes
            "recipient": str,       # checksummed wallet address
            "timestamp": int,       # epoch seconds, when it was minted
            "tokenURI": str,
        }
    """
    exists, token_id = contract.functions.verifyByHash(
        Web3.to_bytes(hexstr=document_hash)
    ).call()

    if not exists:
        return None

    credential = contract.functions.getCredential(token_id).call()

    # credential is a tuple in the exact struct field order from the ABI:
    # (tokenId, studentName, degreeName, graduationDate, documentCID,
    #  documentHash, recipient, timestamp)
    (
        cred_token_id,
        student_name,
        degree_name,
        graduation_date,
        document_cid,
        cred_document_hash,
        recipient,
        timestamp,
    ) = credential

    return {
        "tokenId": cred_token_id,
        "studentName": student_name,
        "degreeName": degree_name,
        "graduationDate": datetime.fromtimestamp(graduation_date, tz=timezone.utc).isoformat(),
        "documentCID": document_cid,
        "documentHash": f"0x{cred_document_hash.hex()}",
        "recipient": recipient,
        "timestamp": datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat(),
        "tokenURI": contract.functions.tokenURI(cred_token_id).call(),
    }