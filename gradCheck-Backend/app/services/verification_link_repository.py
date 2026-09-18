import pymysql

from services.db import get_connection


class VerificationLinkRepository:
    """CRUD operations for the verification_links table.

    Only a SHA-256 hash of each link's token is ever stored — the raw
    token is generated in main.py, returned to the caller once, and never
    persisted. See dbScripts/table_verification_links.sql."""

    def create(self, registration_id, token_hash, expires_at):
        """INSERT a new verification link. Returns the new row's id."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO verification_links
                        (registration_id, token_hash, expires_at)
                    VALUES (%s, %s, %s)
                    """,
                    (registration_id, token_hash, expires_at),
                )
                return cursor.lastrowid
        finally:
            connection.close()

    def get_by_id(self, link_id):
        """SELECT one link by its id. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, registration_id, created_at, expires_at, revoked
                    FROM verification_links
                    WHERE id = %s
                    """,
                    (link_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def get_by_registration_ids(self, registration_ids):
        """SELECT every link belonging to any of these registration_ids
        (a student can have several registrations — one per degree)."""
        if not registration_ids:
            return []
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                placeholders = ", ".join(["%s"] * len(registration_ids))
                cursor.execute(
                    f"""
                    SELECT id, registration_id, created_at, expires_at, revoked
                    FROM verification_links
                    WHERE registration_id IN ({placeholders})
                    ORDER BY created_at DESC
                    """,
                    tuple(registration_ids),
                )
                return cursor.fetchall()
        finally:
            connection.close()

    def get_by_token_hash(self, token_hash):
        """SELECT one link by its token_hash — used to redeem a link on the
        public verify page. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, registration_id, created_at, expires_at, revoked
                    FROM verification_links
                    WHERE token_hash = %s
                    """,
                    (token_hash,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def revoke(self, link_id):
        """UPDATE a link's revoked flag to TRUE. Returns False if the id
        doesn't exist."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE verification_links SET revoked = TRUE WHERE id = %s",
                    (link_id,),
                )
                return cursor.rowcount > 0
        finally:
            connection.close()
