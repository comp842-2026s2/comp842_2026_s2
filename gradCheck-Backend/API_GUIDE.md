# gradCheck Backend — API Guide (for Frontend)

## 1. How to run the backend locally

```
cd gradCheck-Backend/app
source venv/bin/activate
uvicorn main:app --reload
```

(First time only — see `gradCheck-Backend/ReadMe.txt` for installing packages and setting up `.env`, including the new `JWT_SECRET` value needed for login.)

Once running, the API is available at:

```
http://127.0.0.1:8000
```

Interactive docs (test any endpoint directly in the browser, no code needed):

```
http://127.0.0.1:8000/docs
```

## 2. Authentication

`POST /register`, `POST /generate-pdf`, and `GET /students` now require a login token — everything else (`GET /degrees`, `GET /verify/{id}`) is still public, no login needed.

### `POST /login`

Request body:
```json
{ "login_id": "admin1", "login_password": "yourpassword" }
```

Response (200):
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer", "login_type": 2 }
```

`login_type` — `1` = student, `2` = admin. (Confirm this mapping if the DB team changes it.)

Response (401) — wrong `login_id` or `login_password`:
```json
{ "detail": "Invalid login_id or password" }
```

### Using the token

Send it on every protected request as a header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

In `/docs`: call `POST /login` once, copy the `access_token` value, click the **Authorize** button (top right) and paste it in (no need to type "Bearer", Swagger adds that for you).

If the token is missing or expired, protected endpoints return **401**. If it's a valid token but not an admin one (e.g. a student token calling `/register`), they return **403**.

## 3. Endpoints

### `GET /degrees` — Registration page's degree dropdown

No auth needed.

Response (200):
```json
[
  { "degree_id": 1, "degree_name": "Bachelor of Computer Science" },
  { "degree_id": 2, "degree_name": "Bachelor of Engineering" },
  { "degree_id": 3, "degree_name": "Master of Information Technology" }
]
```

(Field is `degree_id`, not `id` — use that key when reading the response.)

Use this instead of hardcoding `degree_id` values — it always reflects what's actually active in the database.

### `POST /register` — Registration page (**admin token required**)

Request body:
```json
{
  "student_id": "S1005",
  "student_name": "Jane Doe",
  "degree_id": 1,
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "conferral_date": "2026-12-15"
}
```

Response (200):
```json
{ "registration_id": 8, "status": "registered" }
```

Response (400) — if `degree_id` doesn't exist, or `student_id` is already registered:
```json
{ "detail": "student_id S1005 is already registered" }
```

### `GET /verify/{registration_id}` — Verify Certificate page

No auth needed — this is the public lookup anyone with the link can use.

Example: `GET /verify/7`

Response (200) — certificate released (conferral date has arrived):
```json
{
  "id": 7,
  "student_id": "S1004",
  "student_name": "Test Student",
  "degree_name": "Bachelor of Engineering",
  "conferral_date": "2026-12-15",
  "status": "pdf_generated",
  "pdf_hash": "0xe39a916cc4d2b626d58dd35c971fc08f08d805d6493b4ed8a89f10584d2cb29a",
  "ipfs_cid": "bafye39a916cc4d2b626d58dd35c971fc08f08d805d6493b",
  "token_id": null,
  "mint_tx_hash": null,
  "minted_at": null
}
```

`status` will be one of: `registered` (just signed up, no certificate yet), `pdf_generated` (certificate ready, not minted yet), `minted` (on the blockchain — once Han Zaw's part is wired in), or `pending_release` (see below).

**Certificates prepared ahead of the graduation date**: if `conferral_date` is in the future, the certificate can already be generated behind the scenes, but this endpoint hides the hash/CID/mint details and returns `"status": "pending_release"` instead — nothing is verifiable before it's officially conferred:
```json
{
  "id": 7,
  "student_id": "S1004",
  "student_name": "Test Student",
  "degree_name": "Bachelor of Engineering",
  "conferral_date": "2026-12-15",
  "status": "pending_release",
  "pdf_hash": null,
  "ipfs_cid": null,
  "token_id": null,
  "mint_tx_hash": null,
  "minted_at": null
}
```

Response (404) — if the id doesn't exist:
```json
{ "detail": "Registration not found" }
```

### `GET /students` — Admin "all students" list (**login token required**)

No request body. Returns every registration regardless of status (not just `registered` ones).

Response (200):
```json
[
  {
    "id": 8,
    "student_id": "S1005",
    "student_name": "Jane Doe",
    "degree_name": "Bachelor of Computer Science",
    "wallet_address": "0x1234...",
    "conferral_date": "2026-12-15",
    "status": "registered",
    "pdf_hash": null,
    "ipfs_cid": null,
    "token_id": null,
    "mint_tx_hash": null,
    "minted_at": null,
    "registered_at": "2026-09-14T10:22:00"
  }
]
```

### `POST /generate-pdf` — Admin "Generate PDF" button (**admin token required**)

No request body needed. Processes every student with `status='registered'` in one go.

Response (200):
```json
{
  "processed": 2,
  "results": [
    { "registration_id": 2, "student_id": "S1002", "pdf_hash": "0x...", "ipfs_cid": "bafy..." }
  ]
}
```

## 4. Notes

- All responses are JSON.
- IPFS uploads are **live** (real Pinata storage) — no longer dry-run. Every `pdf_hash`/`ipfs_cid` returned is real and verifiable on `https://gateway.pinata.cloud/ipfs/{cid}`.
- CORS is already enabled for `http://localhost:5173` (Vite's default dev port). If your dev server runs on a different port, let Aung know so it can be added.
- Store the `access_token` from `/login` in memory (or a cookie) on the Frontend and attach it as `Authorization: Bearer <token>` on `/register`, `/generate-pdf`, and `/students` calls. It expires after 8 hours, after which `/login` needs to be called again.
