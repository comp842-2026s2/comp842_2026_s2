import pymysql

from services.db import get_connection


class LoginRepository:
    """Read/write operations for the login_info table (authentication)."""

    def get_by_login_id(self, login_id):
        """SELECT one login_info row by login_id. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id, login_id, login_password, login_type "
                    "FROM login_info WHERE login_id = %s",
                    (login_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def create(self, login_id, hashed_password, login_type):
        """INSERT a new login_info row. `hashed_password` must already be a
        bcrypt hash (see services.auth.hash_password) — never store a
        plaintext password. Returns the new row's id.
        Raises ValueError if login_id is already taken."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id FROM login_info WHERE login_id = %s", (login_id,)
                )
                if cursor.fetchone() is not None:
                    raise ValueError(f"login_id {login_id} is already taken")

                cursor.execute(
                    "INSERT INTO login_info (login_id, login_password, login_type) "
                    "VALUES (%s, %s, %s)",
                    (login_id, hashed_password, login_type),
                )
                return cursor.lastrowid
        finally:
            connection.close()
