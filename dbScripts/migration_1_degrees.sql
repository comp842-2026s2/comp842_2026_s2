-- Migration step 1 of 5: degrees — add university_name.
-- Run this alone first, then check the Action Output before moving to
-- migration_2_table_students.sql.

USE gradcheck;
SET SQL_SAFE_UPDATES = 0;

-- Portable "add column if it doesn't already exist" check (works on old
-- MySQL and MariaDB, unlike "ADD COLUMN IF NOT EXISTS" which needs a
-- newer MySQL). Safe to re-run even if this already succeeded once.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'gradcheck' AND TABLE_NAME = 'degrees' AND COLUMN_NAME = 'university_name'
);
SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE degrees ADD COLUMN university_name VARCHAR(250) NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill existing rows with a placeholder — replace 'TBD - replace
-- with real university name' below with the real name first if you know
-- it, otherwise update it later with a plain UPDATE once the team confirms.
UPDATE degrees
SET university_name = 'TBD - replace with real university name'
WHERE university_name IS NULL;

ALTER TABLE degrees MODIFY COLUMN university_name VARCHAR(250) NOT NULL;

-- Check: every row should now show a university_name.
SELECT id, degree_name, university_name, active FROM degrees;
