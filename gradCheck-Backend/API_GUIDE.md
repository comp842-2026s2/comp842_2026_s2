# gradCheck Backend — API Guide (for Frontend)

## 1. How to run the backend locally

```
cd gradCheck-Backend/app
source venv/bin/activate
uvicorn main:app --reload
```

(First time only — see `gradCheck-Backend/ReadMe.txt` for installing packages and setting up `.env`.)

Once running, the API is available at:

```
http://127.0.0.1:8000
```

Interactive docs (test any endpoint directly in the browser, no code needed):

```
http://127.0.0.1:8000/docs
```

## 2. Endpoints

### `POST /register` — Registration page

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

`degree_id` options — `1` = Bachelor of Computer Science, `2` = Bachelor of Engineering, `3` = Master of Information Technology.

### `GET /verify/{registration_id}` — Verify Certificate page

Example: `GET /verify/7`

Response (200):
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

`status` will be one of: `registered` (just signed up, no certificate yet), `pdf_generated` (certificate ready, not minted yet), `minted` (on the blockchain — once Han Zaw's part is wired in).

Response (404) — if the id doesn't exist:
```json
{ "detail": "Registration not found" }
```

### `POST /generate-pdf` — Admin "Generate PDF" button

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

## 3. Notes

- All responses are JSON.
- IPFS uploads are currently in **dry-run mode** (fake CID) until Han Zaw shares the Pinata API key — this doesn't block Frontend work, the response shape is identical either way.
- CORS is already enabled for `http://localhost:5173` (Vite's default dev port). If your dev server runs on a different port, let Aung know so it can be added.
