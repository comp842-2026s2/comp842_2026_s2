-- Migration step 5 of 5: copy every student_registrations row into the
-- new certificates table, denormalizing degree_name/university_name from
-- degrees and generating a certificate_id (student_registrations never
-- had one). Run this after migration_4_data_students.sql succeeded. Safe
-- to re-run — skips (student_id, degree_id) pairs that already exist.

USE gradcheck;

INSERT INTO certificates
    (certificate_id, student_id, degree_id, degree_name, university_name,
     wallet_address, conferral_date, status, pdf_hash, ipfs_cid,
     pdf_generated_at, token_id, mint_tx_hash, minted_at, last_error,
     registered_at)
SELECT
    CONCAT('CERT-', LPAD(sr.id, 10, '0')),
    sr.student_id, sr.degree_id, d.degree_name, d.university_name,
    sr.wallet_address, sr.conferral_date, sr.status, sr.pdf_hash, sr.ipfs_cid,
    sr.pdf_generated_at, sr.token_id, sr.mint_tx_hash, sr.minted_at, sr.last_error,
    sr.registered_at
FROM student_registrations sr
JOIN degrees d ON sr.degree_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM certificates c
    WHERE c.student_id = sr.student_id AND c.degree_id = sr.degree_id
);

-- Final check: compare row counts across all three tables.
SELECT
    (SELECT COUNT(*) FROM student_registrations) AS old_registrations,
    (SELECT COUNT(*) FROM students)               AS new_students,
    (SELECT COUNT(*) FROM certificates)            AS new_certificates;

-- Once these counts look right and the backend has been live-tested
-- against the new schema, student_registrations can be dropped — that's
-- NOT included here on purpose, so nothing old gets deleted until the
-- team confirms the new tables are working.
