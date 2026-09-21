import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3
from datetime import datetime, timezone

load_dotenv()

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
        "gas": 500_000,
        "gasPrice": w3.eth.gas_price,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    minted = contract.events.CredentialMinted().process_receipt(receipt)
    token_id = minted[0]["args"]["tokenId"] if minted else None

    return {"txHash": tx_hash.hex(), "tokenId": token_id}

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