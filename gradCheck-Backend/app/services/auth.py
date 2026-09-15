"""Password hashing and JWT helpers for login_info-based authentication."""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "480"))  # 8 hours

# login_info.login_type values. This is an assumption — confirm the real
# mapping with whoever designed the login_info table, and update here if
# it's different.
LOGIN_TYPE_STUDENT = 1
LOGIN_TYPE_ADMIN = 2

# Using the `bcrypt` package directly (not passlib) — passlib's bcrypt
# wrapper is broken by recent bcrypt releases (a known upstream
# incompatibility), so this sidesteps that entirely.


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storage in login_info.login_password.
    Never store a plaintext password directly."""
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(login_id: str, login_type: int) -> str:
    """Issue a JWT for a successfully authenticated login_info row."""
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not set in .env")
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": login_id, "login_type": login_type, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode/verify a JWT. Raises a jwt exception if invalid or expired."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
