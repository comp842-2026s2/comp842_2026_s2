USE gradcheck;


CCREATE TABLE login_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(100) NOT NULL UNIQUE,
    login_password VARCHAR(255) NOT NULL,
    login_type INT NOT NULL
);