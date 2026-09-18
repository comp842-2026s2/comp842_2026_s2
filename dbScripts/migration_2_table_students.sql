-- Migration step 2 of 5: create the students table (one row per student —
-- personal info). Run this after migration_1_degrees.sql succeeded.

USE gradcheck;

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

-- Check: table should now exist with 0 rows (data comes in step 4).
SELECT COUNT(*) AS students_row_count FROM students;
