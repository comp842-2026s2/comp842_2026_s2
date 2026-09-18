USE gradCheck;

INSERT INTO student_registrations
    (student_id, student_name, degree_id, wallet_address, conferral_date, status)
VALUES
    ('S1006', 'HAN ZAW', 1, '0x1234567890123456789012345678901234abcd', '2026-12-15', 1);
 
    
    INSERT INTO login_info (login_id, login_password, login_type)
VALUES ('S1006','$2b$12$ixgCsfutdtR4/oXuV9./E.TNXaiLkkugF/AZvSMCZcf3XRMYJpjiq', 1);