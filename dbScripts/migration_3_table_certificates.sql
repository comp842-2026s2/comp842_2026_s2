-- Migration step 3 of 5: create the certificates table (one row per
-- student+degree — the "many" side). Run this after
-- migration_2_table_students.sql succeeded.

USE gradcheck;

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

-- Check: table should now exist with 0 rows (data comes in step 5).
SELECT COUNT(*) AS certificates_row_count FROM certificates;
