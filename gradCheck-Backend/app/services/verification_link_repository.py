import pymysql

from services.db import get_connection

# dbScripts/table_verification_links.sql (Saw Lwin Oo's version) names its
# columns differently from what this file exposes to the rest of the app:
#   DB column          | this file's field
#   --------------------|-------------------
#   student_id (BIGINT) | registration_id  (it's actually the
#                         student_registrations.id of the row this link
#                         covers — a rename, not a new relationship)
#   verification_token  | still holds a SHA-256 HASH, not the raw token —
#                         the column name changed, the security design
#                         (never store the raw token) did not
#   is_active            | inverted into `revoked` (is_active=False ==
#                         revoked=True) so the rest of the app and the
#                         already-documented API response shape didn't
#                         need to change


class VerificationLinkRepository:
    """CRUD operations for the verification_links table."""

    def create(self, registration_id, token_hash, expires_at):
        """INSERT a new verification link. Returns the new row's id."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO verification_links
                        (student_id, verification_token, expires_at, is_active)
                    VALUES (%s, %s, %s, TRUE)
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
                    SELECT id, student_id AS registration_id, created_at,
                           expires_at, is_active
                    FROM verification_links
                    WHERE id = %s
                    """,
                    (link_id,),
                )
                row = cursor.fetchone()
                return self._to_public(row) if row else None
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
                    SELECT id, student_id AS registration_id, created_at,
                           expires_at, is_active
                    FROM verification_links
                    WHERE student_id IN ({placeholders})
                    ORDER BY created_at DESC
                    """,
                    tuple(registration_ids),
                )
                return [self._to_public(row) for row in cursor.fetchall()]
        finally:
            connection.close()

    def get_by_token_hash(self, token_hash):
        """SELECT one link by its token hash — used to redeem a link on
        the public verify page. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, student_id AS registration_id, created_at,
                           expires_at, is_active
                    FROM verification_links
                    WHERE verification_token = %s
                    """,
                    (token_hash,),
                )
                row = cursor.fetchone()
                return self._to_public(row) if row else None
        finally:
            connection.close()

    def revoke(self, link_id):
        """Set a link's is_active to FALSE (i.e. revoked=True). Returns
        False if the id doesn't exist."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE verification_links SET is_active = FALSE WHERE id = %s",
                    (link_id,),
                )
                return cursor.rowcount > 0
        finally:
            connection.close()

    @staticmethod
    def _to_public(row):
        """Translate the DB's is_active into the revoked flag the rest of
        the app (and the already-documented API) expects."""
        row["revoked"] = not row.pop("is_active")
        return row
