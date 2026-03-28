# Food-Bridge

Real-time surplus food redistribution platform (web). Product direction follows `FoodBridge_PRD_Final.docx` in this repo.

## MVP choices (per build)

- **Media**: Optional image URLs or placeholders only — **no Cloudinary** integration.
- **Notifications**: **WebSocket** fan-out to connected browsers — **no Firebase / FCM**.
- **Realtime bus**: **In-memory** on the API process — **no Redis** (fine for hackathon demos; scale-out would need Redis or similar).
- **Demo geography**: **Chennai** centre with `npm run db:seed` (10 listings + two demo accounts).
- **Deployment target**: **Vercel** (frontend), **Railway** (API), **Supabase** (managed PostgreSQL + PostGIS). Develop locally until you wire those hosts.

## Structure

- **`frontend`** — React + Vite + TypeScript + Tailwind + Leaflet map
- **`backend`** — Node.js + Express (REST + WebSocket on `/ws`)

## Quick start

### Database (PostGIS)

From the repo root:

```bash
docker compose up -d
```

The database is exposed on host port **5433** (not 5432) so it does not fight with a local PostgreSQL install on Windows. `DATABASE_URL` in `backend/.env` must use that port.

If migrations report **password authentication failed**, the DB files were almost certainly created **before** `POSTGRES_HOST_AUTH_METHOD=trust` was added; that setting only runs on **first** database init. The compose file uses a **new volume name** (`foodbridge_pgdata_v2`) so `docker compose up -d` creates a fresh cluster. Run from repo root:

`docker compose down` then `docker compose up -d`, wait ~20s, then `cd backend` and `npm run db:migrate` / `npm run db:seed`.

Local `DATABASE_URL` has **no password** in the URL (trust auth). Remove the old unused volume if you like: `docker volume rm foodbridge_foodbridge_pgdata`.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Health: http://localhost:4000/health · WebSocket: `ws://localhost:4000/ws`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the dev server **proxies** `/api` and `/ws` to port **4000**.

### Demo logins (after seed)

| Role      | Phone           | Password          |
| --------- | --------------- | ----------------- |
| Provider  | `+919876543210` | `DemoProvider123` |
| Recipient | `+919876543211` | `DemoRecipient123` |

## API sketch

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET /api/listings/nearby?lat=&lng=&radius_km=` · `GET /api/listings/:id`
- `POST /api/listings` (provider/admin JWT)
- `PATCH /api/listings/:id/claim` (recipient/volunteer/admin JWT) → returns `qr_token`
- `POST /api/listings/:id/confirm` body `{ "qr_token" }` (listing owner or admin)
- `GET /api/dashboard/impact`

## Split hosts (later)

Set **`VITE_API_URL`** to your Railway API origin (no trailing slash) so the browser can call the API from Vercel. Set **`VITE_WS_URL`** to the full WebSocket URL (for example `wss://your-api.host/ws`).

## Environment

Use **`CORS_ORIGIN`** for allowed browser origins (comma-separated). **`JWT_SECRET`** must be strong in production.
