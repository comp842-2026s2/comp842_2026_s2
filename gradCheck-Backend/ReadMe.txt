Installed
=========

- Python virtual environment: gradCheck-Backend/app/venv
- Packages (via pip):
  - fastapi
  - uvicorn[standard]
  - weasyprint
  - pymysql
  - requests
  - python-dotenv
  - jinja2
- System library (via Homebrew, required by weasyprint on Mac):
  - pango

How to install (step by step)
==============================

1. Go to the backend app folder:
   cd gradCheck-Backend/app

2. Create a Python virtual environment:
   python3 -m venv venv

3. Activate it:
   source venv/bin/activate
   (on Windows: venv\Scripts\activate)

   Your terminal prompt should now show (venv) at the front.

4. Install the required packages:
   pip install fastapi "uvicorn[standard]" weasyprint pymysql requests python-dotenv jinja2

5. Install system library needed by weasyprint (Mac only, via Homebrew):
   brew install pango

6. Mac only (Apple Silicon, e.g. M1/M2/M3) — weasyprint may fail with
   "cannot load library 'libgobject-2.0-0'" unless Homebrew's lib folder
   is on the library path. Fix it permanently by running this once:
   echo 'export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"' >> ~/.zshrc
   Then restart the terminal (or run: source ~/.zshrc)

7. Create a .env file inside gradCheck-Backend/app (same folder as main.py)
   with your local MySQL details:
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=gradCheck

   This file is already in .gitignore, so it will never be pushed to Git.

8. To leave the virtual environment when done:
   deactivate

How to run the backend server
==============================

1. cd gradCheck-Backend/app
2. source venv/bin/activate
3. uvicorn main:app --reload
4. Open http://127.0.0.1:8000/docs in a browser to see and test the API.

Folder structure
================

gradCheck-Backend/app/
  main.py              - FastAPI app, all API endpoints
  services/             - business logic (one file per concern)
    db.py                  - MySQL connection helper
    registration_repository.py - all registrations table CRUD (insert/update/select)
    pdf_generator.py       - renders the certificate PDF
    hasher.py               - sha256 hash of a PDF
    ipfs_client.py          - uploads a PDF to IPFS (Pinata)
  templates/            - degree_template.html (Jinja2 certificate layout)
  tests/                 - manual test scripts (test_pdf.py, test_ipfs.py, test_db.py)
  outPut/                - generated PDF files land here (test runs only)
