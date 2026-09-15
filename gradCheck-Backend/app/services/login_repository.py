import pymysql

from services.db import get_connection


class LoginRepository:
    """Read operations for the login_info table (authentication)."""

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
