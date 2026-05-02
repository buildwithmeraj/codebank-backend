# CodeBank Backend

Simple Express + MongoDB backend for managing categories and code snippets with Firebase token verification.

## Live Site

- Client: https://codebank.meraj.pro
- Server: https://codebank-api.vercel.app/

## What It Does

- Category CRUD for authenticated users
- Code snippet CRUD under categories
- Per-user data isolation using verified Firebase email

## Tech Stack

- Node.js
- Express
- MongoDB (`mongodb` driver)
- Firebase Admin SDK

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create/update `.env` in project root:

```env
PORT=5000
mongodb_uri=your_mongodb_connection_string
FB_SERVICE_KEY=your_base64_encoded_firebase_service_account_json
CLIENT_URL=http://localhost:5173
```

3. Start server:

```bash
node index.js
```

Server runs at `http://localhost:5000` by default.

## Environment Variables

- `PORT`: Server port
- `mongodb_uri`: MongoDB connection URI
- `FB_SERVICE_KEY`: Base64-encoded Firebase Admin service account JSON
- `CLIENT_URL`: Allowed CORS origin

## API Routes

### Health

- `GET /`

### Categories

- `GET /categories`
- `GET /total-categories`
- `GET /category/:id`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Codes

- `GET /codes/:id` (all codes in a category)
- `GET /total-codes`
- `GET /all-codes`
- `GET /code/:id`
- `POST /codes/:id`
- `PATCH /codes/:id`
- `DELETE /codes/:id`

## Auth

All routes except `GET /` require:

- `Authorization: Bearer <firebase_id_token>`

## Notes

- Route IDs must be valid MongoDB ObjectIds.
- Code documents are linked to categories with `categoryId`.
