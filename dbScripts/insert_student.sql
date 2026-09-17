-- Quick way to add a student directly via SQL, without going through the
-- POST /register API. Useful for seeding test data.
--
-- Prefer POST /register (admin token required) when possible — it also
-- validates that degree_id exists and student_id isn't already registered.
-- Use this script only for quick manual/test inserts.

USE gradcheck;

INSERT INTO student_registrations
    (student_id, student_name, degree_id, wallet_address, conferral_date, status)
VALUES
    ('S1007', 'Replace Name', 1, '0x1234567890123456789012345678901234abcd', '2026-12-15', 1);

-- Column notes:
--   degree_id : 1 = Bachelor of Computer Science
--               2 = Bachelor of Engineering
--               3 = Master of Information Technology
--   status    : 1 = registered
--               2 = pdf_generated
--               3 = minted
--               4 = failed
--   wallet_address : must be a 42-character 0x... address (dummy is fine for testing)
--
-- To add several students at once, add more rows to VALUES, comma-separated:
--
-- INSERT INTO student_registrations
--     (student_id, student_name, degree_id, wallet_address, conferral_date, status)
-- VALUES
--     ('S1007', 'Student One', 1, '0x1111111111111111111111111111111111aaaa', '2026-12-15', 1),
--     ('S1008', 'Student Two', 2, '0x2222222222222222222222222222222222bbbb', '2026-12-15', 1);
