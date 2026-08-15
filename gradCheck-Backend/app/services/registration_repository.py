import pymysql

from services.db import get_connection

# The `registrations.status` column is stored as an INT in the real schema
# (dbScripts/table_registrations.sql), not a string — this maps the
# human-readable names the rest of the code (and the API) uses onto the
# integer codes actually stored in the database.
STATUS_CODES = {
    1: "registered",
    2: "pdf_generated",
    3: "minted",
    4: "failed",
}
STATUS_TO_CODE = {name: code for code, name in STATUS_CODES.items()}


class RegistrationRepository:
    """CRUD operations for the registrations table."""

    def create(self, student_id, student_name, degree_id, wallet_address, conferral_date):
        """INSERT a new registration row. Returns the new row's id.
        Raises ValueError if the degree_id doesn't exist or the student_id
        is already registered."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT id FROM degrees WHERE id = %s", (degree_id,))
                if cursor.fetchone() is None:
                    raise ValueError(f"degree_id {degree_id} does not exist")

                cursor.execute("SELECT id FROM student_registrations WHERE student_id = %s", (student_id,))
                if cursor.fetchone() is not None:
                    raise ValueError(f"student_id {student_id} is already registered")

                cursor.execute(
                    """
                    INSERT INTO student_registrations
                        (student_id, student_name, degree_id, wallet_address, conferral_date, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (student_id, student_name, degree_id, wallet_address, conferral_date,
                     STATUS_TO_CODE["registered"]),
                )
                return cursor.lastrowid
        finally:
            connection.close()

    def get_by_id(self, registration_id):
        """SELECT one registration (joined with degree name), for verification.
        Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT r.id, r.student_id, r.student_name, d.degree_name,
                           r.conferral_date, r.status, r.pdf_hash, r.ipfs_cid,
                           r.token_id, r.mint_tx_hash, r.minted_at
                    FROM student_registrations r
                    JOIN degrees d ON r.degree_id = d.id
                    WHERE r.id = %s
                    """,
                    (registration_id,),
                )
                result = cursor.fetchone()
                if result is not None:
                    # Translate the stored int code back to the readable
                    # name — API consumers (Frontend) shouldn't need to
                    # know the DB's internal status codes.
                    result["status"] = STATUS_CODES.get(result["status"], result["status"])
                return result
        finally:
            connection.close()

    def get_registered(self):
        """SELECT all student_registrations with status='registered' — the batch
        that 'Generate PDF' processes."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT r.id, r.student_id, r.student_name, r.conferral_date,
                           d.degree_name
                    FROM student_registrations r
                    JOIN degrees d ON r.degree_id = d.id
                    WHERE r.status = %s
                    """,
                    (STATUS_TO_CODE["registered"],),
                )
                return cursor.fetchall()
        finally:
            connection.close()

    def update_pdf_info(self, registration_id, pdf_hash, ipfs_cid):
        """UPDATE a registration after its PDF/hash/IPFS work is done,
        and mark its status as 'pdf_generated'."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE student_registrations
                    SET pdf_hash = %s,
                        ipfs_cid = %s,
                        pdf_generated_at = NOW(),
                        status = %s
                    WHERE id = %s
                    """,
                    (pdf_hash, ipfs_cid, STATUS_TO_CODE["pdf_generated"], registration_id),
                )
        finally:
            connection.close()
