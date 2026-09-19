USE gradcheck;

-- Creates one staff login directly in the DB — the same two rows the
-- Register Staff form creates via POST /staff + POST /login/register,
-- just done here so you don't have to go through the UI.
--
-- Edit the three values below (staff_id, full_name, email) before running.
-- Password is preset to "Pass1234" (its bcrypt hash is hardcoded below —
-- you can't just type a plaintext password into SQL, since the backend
-- checks bcrypt hashes, not plaintext, in login_info.login_password).
--
-- Want a different password instead of "Pass1234"? Run this once (needs
-- Python + `pip install bcrypt`) and swap the hash in the second INSERT:
--   python3 -c "import bcrypt; print(bcrypt.hashpw(b'YOUR_PASSWORD', bcrypt.gensalt()).decode())"
--
-- Safe to re-run: both inserts are guarded so re-running with the same
-- staff_id won't create duplicates or error out.

INSERT INTO staff_registrations (staff_id, full_name, email, created_date, updated_date, active)
SELECT 'ST200', 'New Staff Member', 'st200@example.com', CURDATE(), CURDATE(), TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM staff_registrations WHERE staff_id = 'ST200'
);

-- login_type = 2 means staff/admin (1 = student). login_id must match the
-- staff_id above — that's how the app links the two rows together.
INSERT INTO login_info (login_id, login_password, login_type)
SELECT 'ST200', '$2b$12$MtCn1NV29X9exfqgkGytu.IXg.Jvp./mTynGVUO8eXimdqJ1hK3vO', 2
WHERE NOT EXISTS (
    SELECT 1 FROM login_info WHERE login_id = 'ST200'
);

-- Verify:
-- SELECT * FROM staff_registrations WHERE staff_id = 'ST200';
-- SELECT * FROM login_info WHERE login_id = 'ST200';
