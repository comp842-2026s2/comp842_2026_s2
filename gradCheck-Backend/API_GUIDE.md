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

`POST /generate-pdf`, `GET /students`, and all `/staff` endpoints require a login token — `GET /degrees`, `GET /verify/{id}`, and `POST /register` (changed 2026-09-19 — see below) are public, no login needed.

There's only one admin-level `login_type` (`2`) — it's used for both admin and staff accounts, so any `login_type: 2` login can use the `/staff` endpoints too.

### `POST /login`

Request body:
```json
{ "login_id": "admin1", "login_password": "yourpassword" }
```

Response (200):
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer", "login_type": 2, "login_id": "admin1" }
```

`login_type` — `1` = student, `2` = admin. (Confirm this mapping if the DB team changes it.)

**New field as of 2026-09-19:** `login_id` — the id that was just logged in with, echoed back so the Frontend knows "who am I" without decoding the JWT. This is what you build `/students/{studentid}/...` URLs with for a student's own session.

Response (401) — wrong `login_id` or `login_password`:
```json
{ "detail": "Invalid login_id or password" }
```

### `POST /login/register` — Create a new login account (**admin token required**)

Creates a new row in `login_info` — replaces manually INSERT-ing a bcrypt hash via Workbench. The password is hashed on the server; it's never stored in plaintext and never returned in any response.

Request body:
```json
{ "login_id": "student2", "login_password": "TheirChosenPassword", "login_type": 1 }
```

`login_type` — `1` = student, `2` = admin/staff. Defaults to `1` if omitted.

Response (200):
```json
{ "id": 3, "login_id": "student2", "login_type": 1 }
```

Response (400) — `login_id` already taken, or `login_type` isn't `1`/`2`:
```json
{ "detail": "login_id student2 is already taken" }
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
  { "degree_id": 1, "degree_name": "Bachelor of Computer Science", "university_name": "TBD - replace with real university name" },
  { "degree_id": 2, "degree_name": "Bachelor of Engineering", "university_name": "TBD - replace with real university name" },
  { "degree_id": 3, "degree_name": "Master of Information Technology", "university_name": "TBD - replace with real university name" }
]
```

(Field is `degree_id`, not `id` — use that key when reading the response.)

**New:** `university_name` was added 2026-09-19 (still a placeholder value until the real name is confirmed — don't hardcode against the placeholder text). Use this instead of hardcoding `degree_id`/university values — it always reflects what's actually active in the database.

### `POST /register` — Registration page (**no login required**)

**Changed 2026-09-19:** this was admin-only; it's now public so a student can self-register instead of a staff member creating every account by hand. Staff can still call it on a student's behalf too — nothing about the request/response shape changed, only the auth requirement was removed. There's no approval/review step — anything sent here is trusted as-is (same as before, just without the admin gate), so keep that in mind if fake submissions become a problem later.

Request body:
```json
{
  "student_id": "S1005",
  "student_name": "Jane Doe",
  "degree_id": 1,
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "conferral_date": "2026-12-15",
  "student_password": "TheirChosenPassword"
}
```

`student_password` is optional. If sent, a login account is created for the student in the same call (`login_id` = `student_id`, `login_type` = 1) — no separate `/login/register` call needed. Omit it to register without creating a login (matches the old behavior).

Response (200):
```json
{ "registration_id": 8, "status": "registered", "login_created": true }
```

`login_created` is `false` if `student_password` wasn't sent, or if that `student_id` already has a login account.

Response (400) — if `degree_id` doesn't exist, or `student_id` is already registered:
```json
{ "detail": "student_id S1005 is already registered" }
```

**2026-09-19 schema change (transparent to the Frontend — same request/response shape above still applies):** behind the scenes, a student's personal info now lives in a `students` table (one row per student) and each degree/registration lives in its own `certificates` row (one row per student+degree) — so a student can hold more than one degree. `registration_id` in every response below is that `certificates` row's own id — same meaning as before, just backed by a different table.

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
  "university_name": "TBD - replace with real university name",
  "wallet_address": "0x1234...",
  "conferral_date": "2026-12-15",
  "status": "pdf_generated",
  "pdf_hash": "0xe39a916cc4d2b626d58dd35c971fc08f08d805d6493b4ed8a89f10584d2cb29a",
  "ipfs_cid": "bafye39a916cc4d2b626d58dd35c971fc08f08d805d6493b",
  "token_id": null,
  "mint_tx_hash": null,
  "minted_at": null,
  "registered_at": "2026-09-14T10:22:00",
  "certificate_id": "CERT-0000000007"
}
```

**New fields as of 2026-09-19:** `university_name`, `wallet_address`, `registered_at`, `certificate_id` (a separate, human-shareable id string — not the same as `id`, which stays the internal row id used in the URL). If your code destructures specific fields rather than reading the whole object, nothing breaks — these are additions, not renames.

`status` will be one of: `registered` (just signed up, no certificate yet), `pdf_generated` (certificate ready, not minted yet), `minted` (on the blockchain — once Han Zaw's part is wired in), or `pending_release` (see below).

**Certificates prepared ahead of the graduation date**: if `conferral_date` is in the future, the certificate can already be generated behind the scenes, but this endpoint hides the hash/CID/mint details and returns `"status": "pending_release"` instead — nothing is verifiable before it's officially conferred:
```json
{
  "id": 7,
  "student_id": "S1004",
  "student_name": "Test Student",
  "degree_name": "Bachelor of Engineering",
  "university_name": "TBD - replace with real university name",
  "wallet_address": "0x1234...",
  "conferral_date": "2026-12-15",
  "status": "pending_release",
  "pdf_hash": null,
  "ipfs_cid": null,
  "token_id": null,
  "mint_tx_hash": null,
  "minted_at": null,
  "registered_at": "2026-09-14T10:22:00",
  "certificate_id": "CERT-0000000007"
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
    "university_name": "TBD - replace with real university name",
    "wallet_address": "0x1234...",
    "conferral_date": "2026-12-15",
    "status": "registered",
    "pdf_hash": null,
    "ipfs_cid": null,
    "token_id": null,
    "mint_tx_hash": null,
    "minted_at": null,
    "registered_at": "2026-09-14T10:22:00",
    "certificate_id": "CERT-0000000008"
  }
]
```

### `GET /students/{studentid}` — Student's own profile (**self or admin token**)

A student's own token can only read their own `studentid`; an admin/staff token can read anyone's. Returns a **list** — a student can hold more than one degree, so there's one entry per registration, not a single object.

Response (200):
```json
[
  {
    "id": 8,
    "student_id": "S1005",
    "student_name": "Jane Doe",
    "degree_name": "Bachelor of Computer Science",
    "university_name": "TBD - replace with real university name",
    "wallet_address": "0x1234...",
    "conferral_date": "2026-12-15",
    "status": "registered",
    "pdf_hash": null,
    "ipfs_cid": null,
    "token_id": null,
    "mint_tx_hash": null,
    "minted_at": null,
    "registered_at": "2026-09-14T10:22:00",
    "certificate_id": "CERT-0000000008"
  }
]
```

Response (403) — a student token requesting someone else's `studentid`:
```json
{ "detail": "Not authorized for this student" }
```

Response (404) — `studentid` doesn't exist:
```json
{ "detail": "Student not found" }
```

### `GET /students/{studentid}/certificate` — Student's certificate status (**self or admin token**)

Same access rule and list shape as above, but applies the same `pending_release` hiding that `/verify` uses — if any certificate's `conferral_date` hasn't arrived yet, that entry's hash/CID/mint fields come back `null` and its `status` is `"pending_release"`, even if the PDF was already generated behind the scenes.

### `GET /students/{studentid}/certificate/download` — Download the certificate PDF (**self or admin token**)

Fetches the actual PDF bytes back from IPFS and returns them as a file download (`Content-Type: application/pdf`), not JSON.

If the student has more than one certificate (multiple degrees), pass `?registration_id=8` to pick which one — required in that case, otherwise:
```json
{ "detail": "This student has multiple registrations — pass ?registration_id=... to pick one" }
```

Response (403) — not released yet:
```json
{ "detail": "Certificate isn't released yet (conferral date hasn't arrived)" }
```

Response (400) — PDF hasn't been generated yet (admin hasn't run `/generate-pdf`):
```json
{ "detail": "Certificate PDF hasn't been generated yet" }
```

### `GET`/`POST /students/{studentid}/verification-links` — Shareable verification links (**self or admin token**)

⚠️ **Not usable yet** — blocked on a pending database migration for the `verification_links` table (tracked separately, ask Aung for status). Both currently return `500`. Shape below is what to build against once that's unblocked.

`POST` body:
```json
{ "registration_id": 8, "expires_in_days": 7 }
```

`POST` response (200) — **the raw `token` is only ever returned here, once** — only its hash is stored, so build the shareable link client-side as e.g. `<verify page>?token=<token>`:
```json
{ "id": 1, "token": "kX9f...", "expires_at": "2026-09-26T10:00:00" }
```

`GET` response (200) — list, without the raw token:
```json
[
  { "id": 1, "registration_id": 8, "created_at": "2026-09-19T10:00:00", "expires_at": "2026-09-26T10:00:00", "revoked": false }
]
```

### `DELETE /students/{studentid}/verification-links/{link_id}` — Revoke a link (**self or admin token**)

⚠️ Same migration block as above. Response (200) once unblocked:
```json
{ "id": 1, "revoked": true }
```

### `GET /staff` — Staff management list (**admin token required**)

No request body. Returns every staff row, including deactivated ones.

Response (200):
```json
[
  {
    "id": 1,
    "staff_id": "ST001",
    "full_name": "Test Staff",
    "email": "teststaff@example.com",
    "created_date": "2026-09-15",
    "updated_date": "2026-09-15",
    "active": 1
  }
]
```

### `POST /staff` — Add a new staff member (**admin token required**)

Request body:
```json
{ "staff_id": "ST002", "full_name": "Jane Staff", "email": "jane@example.com" }
```

Response (200) — the newly created row:
```json
{
  "id": 2,
  "staff_id": "ST002",
  "full_name": "Jane Staff",
  "email": "jane@example.com",
  "created_date": "2026-09-15",
  "updated_date": "2026-09-15",
  "active": 1
}
```

Response (400) — if `staff_id` is already registered:
```json
{ "detail": "staff_id ST002 is already registered" }
```

### `PUT /staff/{id}` — Update or deactivate a staff member (**admin token required**)

Send only the fields you want to change — everything else stays as-is. To deactivate someone instead of deleting them, send `{ "active": false }`.

Request body (all fields optional):
```json
{ "full_name": "New Name", "email": "new@example.com", "active": false }
```

Response (200) — the updated row (same shape as `GET /staff`).

Response (404) — if `id` doesn't exist:
```json
{ "detail": "Staff not found" }
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

- All responses are JSON (except the certificate PDF download, which is a binary file).
- IPFS uploads are **live** (real Pinata storage) — no longer dry-run. Every `pdf_hash`/`ipfs_cid` returned is real and verifiable on `https://gateway.pinata.cloud/ipfs/{cid}`.
- CORS is already enabled for `http://localhost:5173` (Vite's default dev port). If your dev server runs on a different port, let Aung know so it can be added.
- Store the `access_token` from `/login` in memory (or a cookie) on the Frontend and attach it as `Authorization: Bearer <token>` on any endpoint marked "token required" above. It expires after 8 hours, after which `/login` needs to be called again.

## 5. Frontend integration heads-up (2026-09-19)

Comparing the actual API responses above against the current Frontend `models/` found a few mismatches worth reconciling before wiring up the student module UI — flagging here rather than changing Frontend code directly, since it's not the Backend's call how to adjust the UI types:

- **`models/Certificate.ts` → `certificate_id: number`** — the backend's `certificate_id` is a **string** like `"CERT-0000000008"`, not a number.
- **`models/Certificate.ts` → `status: "pending" | "generated" | "minted" | "unavailable"`** — the backend actually sends `"registered"`, `"pdf_generated"`, `"minted"`, `"failed"`, or `"pending_release"` (see `/verify` above). None of these match the Frontend's current enum.
- **`models/Certificate.ts` → `issue_date`, `transaction_hash`, `certificate_hash`, `certificate_file_name`** — the backend doesn't send these; the equivalent fields are `conferral_date`, `mint_tx_hash`, `pdf_hash`, and (for downloading) `GET /students/{studentid}/certificate/download` returns the file directly rather than a filename to look up.
- **`models/Student.ts` → `StudentProfile`** — modeled as a single object, but `GET /students/{studentid}` returns a **list** (a student can have more than one degree/certificate).
- **`models/Degree.ts`** — doesn't yet include the new `university_name` field from `GET /degrees`.

Worth a quick sync with Saw Lwin Oo/the Frontend teammate to update these types against the shapes documented in section 3 above.
