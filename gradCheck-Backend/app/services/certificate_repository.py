import secrets

import pymysql

from services.db import get_connection
from services.degree_repository import DegreeRepository

# Same status-code mapping as the old RegistrationRepository — the
# certificates.status column keeps the exact same INT codes.
STATUS_CODES = {
    1: "registered",
    2: "pdf_generated",
    3: "minted",
    4: "failed",
}
STATUS_TO_CODE = {name: code for code, name in STATUS_CODES.items()}

# Selected/returned fields, kept identical in name and shape to what
# RegistrationRepository used to return, so main.py's ~15 call sites don't
# need to change beyond the import/instantiation line. "registration_id"
# throughout the rest of the app (verify links, /verify/{registration_id},
# etc.) is this row's own auto-increment `id` — unchanged in meaning, just
# now it's a row in `certificates` instead of `student_registrations`.
_SELECT_FIELDS = """
    c.id, c.student_id, s.student_name, c.degree_name, c.university_name,
    c.wallet_address, c.conferral_date, c.status, c.pdf_hash, c.ipfs_cid,
    c.token_id, c.mint_tx_hash, c.minted_at, c.registered_at,
    c.certificate_id
"""


class CertificateRepository:
    """CRUD operations for the certificates table (the "many" side of the
    students/certificates split — one student can have several certificates,
    one per degree they've registered for). Mirrors the old
    RegistrationRepository's public interface (method names + returned
    field shapes) so the rest of the app didn't need to change, except that
    student_name now comes from a JOIN with `students` rather than being
    stored directly on this table."""

    def __init__(self):
        self._degree_repo = DegreeRepository()

    def create(self, student_id, degree_id, wallet_address, conferral_date, student_name=None):
        """INSERT a new certificate row. Returns the new row's id.

        `student_name` is accepted for call-site compatibility but is no
        longer stored here — it lives on the `students` table now, and the
        caller is expected to have already ensured that row exists via
        StudentRepository.get_or_create() before calling this.

        Raises ValueError if the degree_id doesn't exist, or if this
        student already has a certificate for this exact degree (a student
        can hold several degrees, but not duplicate the same one)."""
        degree = self._degree_repo.get_by_id(degree_id)
        if degree is None:
            raise ValueError(f"degree_id {degree_id} does not exist")

        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    "SELECT id FROM certificates WHERE student_id = %s AND degree_id = %s",
                    (student_id, degree_id),
                )
                if cursor.fetchone() is not None:
                    raise ValueError(
                        f"student_id {student_id} already has a certificate for degree_id {degree_id}"
                    )

                # certificate_id is backend-generated (per team decision) —
                # retry on the rare collision against its UNIQUE constraint.
                for _ in range(5):
                    certificate_id = "CERT-" + secrets.token_hex(4).upper()
                    try:
                        cursor.execute(
                            """
                            INSERT INTO certificates
                                (certificate_id, student_id, degree_id, degree_name,
                                 university_name, wallet_address, conferral_date, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                certificate_id,
                                student_id,
                                degree_id,
                                degree["degree_name"],
                                degree["university_name"],
                                wallet_address,
                                conferral_date,
                                STATUS_TO_CODE["registered"],
                            ),
                        )
                        return cursor.lastrowid
                    except pymysql.err.IntegrityError as e:
                        # 1062 = Duplicate entry — only retry on that;
                        # anything else (e.g. the uniqueness check above
                        # racing another request) should surface.
                        if e.args and e.args[0] == 1062 and "certificate_id" in str(e):
                            continue
                        raise
                raise ValueError("failed to generate a unique certificate_id, please retry")
        finally:
            connection.close()

    def get_by_id(self, registration_id):
        """SELECT one certificate (joined with the student's name), for
        verification. Returns None if not found."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    f"""
                    SELECT {_SELECT_FIELDS}
                    FROM certificates c
                    JOIN students s ON c.student_id = s.student_id
                    WHERE c.id = %s
                    """,
                    (registration_id,),
                )
                result = cursor.fetchone()
                if result is not None:
                    result["status"] = STATUS_CODES.get(result["status"], result["status"])
                return result
        finally:
            connection.close()

    def get_by_student_id(self, student_id):
        """SELECT every certificate belonging to one student_id (a student
        can have more than one — one per degree). Used by the student
        module's profile/certificate endpoints."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    f"""
                    SELECT {_SELECT_FIELDS}
                    FROM certificates c
                    JOIN students s ON c.student_id = s.student_id
                    WHERE c.student_id = %s
                    ORDER BY c.registered_at DESC
                    """,
                    (student_id,),
                )
                rows = cursor.fetchall()
                for row in rows:
                    row["status"] = STATUS_CODES.get(row["status"], row["status"])
                return rows
        finally:
            connection.close()

    def get_registered(self):
        """SELECT all certificates with status='registered' — the batch
        that 'Generate PDF' processes."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT c.id, c.student_id, s.student_name, c.conferral_date,
                           c.degree_name
                    FROM certificates c
                    JOIN students s ON c.student_id = s.student_id
                    WHERE c.status = %s
                    """,
                    (STATUS_TO_CODE["registered"],),
                )
                return cursor.fetchall()
        finally:
            connection.close()

    def get_all(self):
        """SELECT every certificate regardless of status — the full
        student list (e.g. for an admin 'all students' view)."""
        connection = get_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(
                    f"""
                    SELECT {_SELECT_FIELDS}
                    FROM certificates c
                    JOIN students s ON c.student_id = s.student_id
                    ORDER BY c.registered_at DESC
                    """
                )
                rows = cursor.fetchall()
                for row in rows:
                    row["status"] = STATUS_CODES.get(row["status"], row["status"])
                return rows
        finally:
            connection.close()

    def update_pdf_info(self, registration_id, pdf_hash, ipfs_cid):
        """UPDATE a certificate after its PDF/hash/IPFS work is done,
        and mark its status as 'pdf_generated'."""
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE certificates
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
