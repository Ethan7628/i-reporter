# i-reporter

> A lightweight incident/reporting app with a separate `backend` (Node/TypeScript) and `frontend` (Vite + React + TypeScript).
## Project structure

- `backend/` — Node + TypeScript API server
- `frontend/` — Vite + React TypeScript app

## Prerequisites

- Node.js 18+ (or current LTS)
- pnpm (recommended) or npm/yarn

## Quick start

Backend

1. Open a terminal and change into the backend directory:

```
cd backend
```

2. Install dependencies:

```
pnpm install
```

3. Create a `.env` file (see Environment Variables below) and start the dev server:

```
pnpm run dev
```

Frontend

1. Open a terminal and change into the frontend directory:

```
cd frontend
```

2. Install dependencies and start the dev server:

```
pnpm install
pnpm run dev
```

Open the app in your browser at the address printed by the frontend dev server (usually `http://localhost:5173`).

## Environment Variables (examples)

Create a `.env` in `backend/` with values appropriate for your environment. Example keys the app commonly expects:

```
DATABASE_URL=postgres://user:pass@localhost:5432/i_reporter
PORT=4000
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

Note: The exact variable names used by the backend are defined in the code. If you want, I can add a `.env.example` file with exact keys found in `backend/src`.

## File uploads

- Uploaded files are stored in `backend/uploads/` (check `backend/src/utils/upload.ts`). Ensure that folder is writable by the server process.

## Scripts (common)

- `pnpm run dev` — start dev server
- `pnpm run build` — build for production (backend or frontend)
- `pnpm run start` — run built production server (backend)

Check each `package.json` in `backend/` and `frontend/` for exact scripts.

## Tests & Linting

If test and lint scripts exist, run them from the relevant folder:

```
cd backend
pnpm run test
pnpm run lint
cd ../frontend
pnpm run test
pnpm run lint
```

## Contributing

- Create an issue for bugs or feature requests.
- Open a branch, implement changes, and submit a pull request against `main`.

## Next steps I can help with

- Add a `.env.example` generated from the code
- Add CI (GitHub Actions) for tests and linting
- Add deployment instructions (Heroku / Vercel / Docker)

---

If you'd like, I can expand the README with an API reference (endpoints), or automatically generate a `.env.example` and add it to the repo. Which would you like next?
