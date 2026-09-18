USE gradcheck;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
	student_id VARCHAR(20) NOT NULL UNIQUE,
	student_name VARCHAR(150) NOT NULL,

	-- Not collected by the Registration form yet — nullable for now,
	-- filled in later via a student profile update.
	date_of_birth DATE NULL,
	email_address VARCHAR(150) NULL,
	phone VARCHAR(20) NULL,
	address_1 VARCHAR(250) NULL,
	address_2 VARCHAR(250) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
