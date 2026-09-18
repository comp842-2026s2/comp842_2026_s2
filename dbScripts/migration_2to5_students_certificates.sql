-- Migration steps 2-5 combined: create students + certificates, then
-- migrate the existing student_registrations data into both. Run this
-- after migration_1_degrees.sql has already succeeded.
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS, and both INSERTs skip rows
-- that already exist.
--
-- Select ALL of this text (Ctrl+A / Cmd+A), then run the whole script
-- (Ctrl+Shift+Enter / Cmd+Shift+Return) — not "execute current statement".

USE gradcheck;

-- ============================================================
-- Step 2: students table (one row per student — personal info)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    student_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NULL,
    email_address VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    address_1 VARCHAR(250) NULL,
    address_2 VARCHAR(250) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Step 3: certificates table (one row per student+degree)
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(20) NOT NULL UNIQUE,
    student_id VARCHAR(20) NOT NULL,

    degree_id INT NOT NULL,
    degree_name VARCHAR(150) NOT NULL,
    university_name VARCHAR(250) NOT NULL,

    wallet_address VARCHAR(42) NOT NULL,
    conferral_date DATE NOT NULL,

    -- ENUM('registered', 'pdf_generated', 'minted', 'failed')
    status INT NOT NULL DEFAULT 1,

    pdf_hash VARCHAR(66) NULL,
    ipfs_cid VARCHAR(100) NULL,
    pdf_generated_at TIMESTAMP NULL,

    token_id BIGINT NULL,
    mint_tx_hash VARCHAR(66) NULL,
    minted_at TIMESTAMP NULL,

    last_error TEXT NULL,

    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_degree UNIQUE (student_id, degree_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Step 4: copy distinct students out of student_registrations
-- ============================================================
INSERT INTO students (student_id, student_name)
SELECT DISTINCT sr.student_id, sr.student_name
FROM student_registrations sr
WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.student_id = sr.student_id
);

-- ============================================================
-- Step 5: copy every student_registrations row into certificates,
-- denormalizing degree_name/university_name and generating a
-- certificate_id (student_registrations never had one)
-- ============================================================
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

-- ============================================================
-- Final check: compare row counts across all three tables
-- ============================================================
SELECT
    (SELECT COUNT(*) FROM student_registrations) AS old_registrations,
    (SELECT COUNT(*) FROM students)               AS new_students,
    (SELECT COUNT(*) FROM certificates)            AS new_certificates;

-- Once these counts look right and the backend has been live-tested
-- against the new schema, student_registrations can be dropped — that's
-- NOT included here on purpose, so nothing old gets deleted until the
-- team confirms the new tables are working.
