-- Migration step 4 of 5: copy distinct students out of
-- student_registrations into the new students table. Run this after
-- migration_3_table_certificates.sql succeeded. Safe to re-run — skips
-- student_ids that already exist in students.

USE gradcheck;

INSERT INTO students (student_id, student_name)
SELECT DISTINCT sr.student_id, sr.student_name
FROM student_registrations sr
WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.student_id = sr.student_id
);

-- Check: should match the number of distinct student_ids in
-- student_registrations.
SELECT
    (SELECT COUNT(DISTINCT student_id) FROM student_registrations) AS distinct_old_students,
    (SELECT COUNT(*) FROM students) AS new_students;
