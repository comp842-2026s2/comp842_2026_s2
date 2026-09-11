"""Shared MySQL connection helper — reads settings from .env.

Supports two connection targets, switched by DB_MODE in .env:
  - "local" — your own local MySQL (localhost). Use this when the shared
    AWS RDS instance isn't running (e.g. Han Zaw stops it overnight).
  - "rds"   — the shared AWS RDS instance the whole team points at.

Only DB_MODE needs to change to switch — the local and RDS settings both
stay in .env at the same time, so there's nothing to overwrite/lose when
you flip back and forth.
"""

import os

import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_MODE = os.environ.get("DB_MODE", "local").strip().lower()

if DB_MODE == "rds":
    DB_HOST = os.environ.get("DB_HOST_RDS", "")
    DB_PORT = int(os.environ.get("DB_PORT_RDS", "3306"))
    DB_USER = os.environ.get("DB_USER_RDS", "")
    DB_PASSWORD = os.environ.get("DB_PASSWORD_RDS", "")
    DB_NAME = os.environ.get("DB_NAME_RDS", "GradCheck")
    # Path to the AWS RDS CA bundle (global-bundle.pem) — required for the
    # TLS connection RDS enforces. Not needed/used in "local" mode.
    DB_SSL_CA = os.environ.get("DB_SSL_CA_RDS", "")
else:
    DB_HOST = os.environ.get("DB_HOST_LOCAL", "localhost")
    DB_PORT = int(os.environ.get("DB_PORT_LOCAL", "3306"))
    DB_USER = os.environ.get("DB_USER_LOCAL", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD_LOCAL", "")
    DB_NAME = os.environ.get("DB_NAME_LOCAL", "gradCheck")
    DB_SSL_CA = ""  # local MySQL doesn't need TLS


def get_connection():
    """Open a new connection to the gradCheck MySQL database — local or
    RDS, depending on DB_MODE."""
    connect_kwargs = dict(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
    )
    if DB_SSL_CA:
        # Matches AWS's recommended --ssl-mode=VERIFY_IDENTITY: verify the
        # server certificate against the CA bundle AND verify the hostname
        # in the certificate matches DB_HOST.
        connect_kwargs["ssl_ca"] = DB_SSL_CA
        connect_kwargs["ssl_verify_cert"] = True
        connect_kwargs["ssl_verify_identity"] = True

    return pymysql.connect(**connect_kwargs)
