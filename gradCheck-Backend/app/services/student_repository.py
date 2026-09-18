import pymysql

from services.db import get_connection


class StudentRepository:
    """CRUD operations for the students table (the "one" side of the new
    one-to-many students/certificates split — one student row can have many
    certificates rows, one per degree they've registered for)."""

    def get_by_student_id(self, student_id):
        """SELECT one student by their student_id. Returns None if not
        found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT student_id, student_name, date_of_birth,
                           email_address, phone, address_1, address_2
                    FROM students
                    WHERE student_id = %s
                    """,
                    (student_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def get_or_create(self, student_id, student_name):
        """Ensure a students row exists for this student_id. If it already
        exists, leaves it untouched (personal-info fields, if any, are
        edited later via a profile-update flow, not overwritten here) and
        just returns the existing row. Otherwise INSERTs a new row with only
        student_id/student_name set — the personal-info fields (DOB, email,
        phone, address) are optional for now since the Registration form
        doesn't collect them yet, and stay NULL until filled in later."""
        existing = self.get_by_student_id(student_id)
        if existing is not None:
            return existing

        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO students (student_id, student_name)
                    VALUES (%s, %s)
                    """,
                    (student_id, student_name),
                )
        finally:
            connection.close()

        return self.get_by_student_id(student_id)

    def update_profile(self, student_id, **fields):
        """Update one or more personal-info fields for a student. `fields`
        may include any of date_of_birth/email_address/phone/address_1/
        address_2. Returns False if the student doesn't exist or no
        recognized fields were passed."""
        allowed = {"date_of_birth", "email_address", "phone", "address_1", "address_2"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return False

        set_clause = ", ".join(f"{col} = %s" for col in updates)
        params = tuple(updates.values()) + (student_id,)

        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE students SET {set_clause} WHERE student_id = %s",
                    params,
                )
                return cursor.rowcount > 0
        finally:
            connection.close()
