import pymysql

from services.db import get_connection


class StaffRepository:
    """CRUD operations for the staff_registrations table."""

    def get_all(self):
        """SELECT every staff row, newest first."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, staff_id, full_name, email, created_date,
                           updated_date, active
                    FROM staff_registrations
                    ORDER BY created_date DESC
                    """
                )
                return cursor.fetchall()
        finally:
            connection.close()

    def get_by_id(self, row_id):
        """SELECT one staff row by its id. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT id, staff_id, full_name, email, created_date,
                           updated_date, active
                    FROM staff_registrations
                    WHERE id = %s
                    """,
                    (row_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def create(self, staff_id, full_name, email):
        """INSERT a new staff row. Returns the new row's id.
        Raises ValueError if staff_id is already registered."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id FROM staff_registrations WHERE staff_id = %s",
                    (staff_id,),
                )
                if cursor.fetchone() is not None:
                    raise ValueError(f"staff_id {staff_id} is already registered")

                cursor.execute(
                    """
                    INSERT INTO staff_registrations
                        (staff_id, full_name, email, created_date, updated_date, active)
                    VALUES (%s, %s, %s, CURDATE(), CURDATE(), TRUE)
                    """,
                    (staff_id, full_name, email),
                )
                return cursor.lastrowid
        finally:
            connection.close()

    def update(self, row_id, full_name=None, email=None, active=None):
        """UPDATE an existing staff row. Only the fields actually passed
        (not None) are changed. Returns False if the id doesn't exist."""
        fields = []
        params = []
        if full_name is not None:
            fields.append("full_name = %s")
            params.append(full_name)
        if email is not None:
            fields.append("email = %s")
            params.append(email)
        if active is not None:
            fields.append("active = %s")
            params.append(active)

        if not fields:
            # Nothing to change — just confirm the row exists.
            return self.get_by_id(row_id) is not None

        fields.append("updated_date = CURDATE()")
        params.append(row_id)

        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE staff_registrations SET {', '.join(fields)} WHERE id = %s",
                    tuple(params),
                )
                return cursor.rowcount > 0
        finally:
            connection.close()
