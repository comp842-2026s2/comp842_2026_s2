USE gradcheck;

CREATE TABLE certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    certificate_id  VARCHAR(20) NOT NULL UNIQUE,
	student_id VARCHAR(20) NOT NULL,
    
	degree_id INT NOT NULL,
	degree_name VARCHAR(150) NOT NULL,
	university_name VARCHAR(250) NOT NULL,
	
    wallet_address VARCHAR(42) NOT NULL,
    conferral_date DATE NOT NULL,

    -- Drives which batch job (Python worker / Node minting trigger) picks up the row
    -- ENUM('registered', 'pdf_generated', 'minted', 'failed')
		
	status INT NOT NULL DEFAULT 1,

    -- Populated by the Python worker after PDF generation
    pdf_hash VARCHAR(66) NULL,          -- keccak256 hash of the generated PDF
    ipfs_cid VARCHAR(100) NULL,         -- IPFS Content Identifier for the stored PDF
    pdf_generated_at TIMESTAMP NULL,

    -- Populated by the Node backend after a successful mint
    token_id BIGINT NULL,
    mint_tx_hash VARCHAR(66) NULL,
    minted_at TIMESTAMP NULL,

    -- Populated on a failed mint, so staff have something to act on
    last_error TEXT NULL,

    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Prevents duplicate registration of the same student for the same degree
    CONSTRAINT uq_student_degree UNIQUE (student_id, degree_id),

    -- Both batch jobs filter on status, so this needs an index at any real scale
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
