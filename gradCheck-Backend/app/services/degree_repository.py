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
                    "SELECT id as degree_id, degree_name, university_name "
                    "FROM degrees WHERE active = 1"
                )
                return cursor.fetchall()
        finally:
            connection.close()

    def get_by_id(self, degree_id):
        """SELECT one degree by id. Returns None if not found. Used by
        CertificateRepository to denormalize degree_name/university_name
        onto the certificates row at registration time."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id as degree_id, degree_name, university_name "
                    "FROM degrees WHERE id = %s",
                    (degree_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()
