USE gradcheck;


INSERT INTO degrees (degree_name, active, university_name) VALUES
    ('Bachelor of Computer Science', TRUE, "Auckland University of Technology"),
    ('Bachelor of Engineering', TRUE, "Auckland University of Technology"),
    ('Master of Information Technology', TRUE, "Auckland University of Technology");
	

-- Admin
INSERT INTO login_info (login_id, login_password, login_type)
	VALUES ('admin', '$2b$12$neLEI3KvoBE/psGrhXlGHuVKgQZekX10Wea3SIQv7OqQmtnmPyelS', 2);


-- Han Zaw
INSERT INTO student_registrations
    (student_id, student_name, degree_id, wallet_address, conferral_date, status)
VALUES
    ('S1006', 'HAN ZAW', 1, '0x1234567890123456789012345678901234abcd', '2026-12-15', 1);
	

INSERT INTO login_info (login_id, login_password, login_type)
	VALUES ('S1006','$2b$12$ixgCsfutdtR4/oXuV9./E.TNXaiLkkugF/AZvSMCZcf3XRMYJpjiq', 1);
	

-- Saw
INSERT INTO student_registrations
    (student_id, student_name, degree_id, wallet_address, conferral_date, status)
VALUES
    ('S1003', 'SAW', 1, '0x1234567890123456789012345678901234abcd', '2027-05-15', 1);

	
INSERT INTO login_info (login_id, login_password, login_type)
	VALUES ('S1003','$2b$12$mREbHXa89QT0BHjuWzSgg.jeomGS.Rojz2oN/71SP8gJ7nnNBYQgu', 1);


