import pymysql

from services.db import get_connection


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

                cursor.execute("SELECT id FROM registrations WHERE student_id = %s", (student_id,))
                if cursor.fetchone() is not None:
                    raise ValueError(f"student_id {student_id} is already registered")

                cursor.execute(
                    """
                    INSERT INTO registrations
                        (student_id, student_name, degree_id, wallet_address, conferral_date, status)
                    VALUES (%s, %s, %s, %s, %s, 'registered')
                    """,
                    (student_id, student_name, degree_id, wallet_address, conferral_date),
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
                    FROM registrations r
                    JOIN degrees d ON r.degree_id = d.id
                    WHERE r.id = %s
                    """,
                    (registration_id,),
                )
                return cursor.fetchone()
        finally:
            connection.close()

    def get_registered(self):
        """SELECT all registrations with status='registered' — the batch
        that 'Generate PDF' processes."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT r.id, r.student_id, r.student_name, r.conferral_date,
                           d.degree_name
                    FROM registrations r
                    JOIN degrees d ON r.degree_id = d.id
                    WHERE r.status = 'registered'
                    """
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
                    UPDATE registrations
                    SET pdf_hash = %s,
                        ipfs_cid = %s,
                        pdf_generated_at = NOW(),
                        status = 'pdf_generated'
                    WHERE id = %s
                    """,
                    (pdf_hash, ipfs_cid, registration_id),
                )
        finally:
            connection.close()
