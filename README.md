# Food-Bridge

Real-time surplus food redistribution platform (web). Product direction follows `FoodBridge_PRD_Final.docx` in this repo.

## Structure

- **`frontend`** — React + Vite + TypeScript + Tailwind CSS
- **`backend`** — Node.js + Express API (REST + WebSockets in later steps)

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Health check: http://localhost:4000/health

## Roadmap (from PRD)

- PostgreSQL + PostGIS listings and radius search
- JWT auth, listings CRUD, claims + QR handoff
- Redis pub-sub + WebSocket fan-out
- Leaflet map, impact dashboard, seed data

## Environment

Set `CORS_ORIGIN` to your Vite origin in production. Connect `DATABASE_URL` when the database layer is added.
