import pymysql

from services.db import get_connection


class DegreeRepository:
    """Read operations for the degrees table."""

    def get_all(self):
        """SELECT all active degrees — used by the Registration page to
        populate the degree dropdown."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id, degree_name FROM degrees WHERE active = 1"
                )
                return cursor.fetchall()
        finally:
            connection.close()
