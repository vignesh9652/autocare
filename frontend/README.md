# AutoCare Frontend

React 18 + Vite + TypeScript single-page application for the AutoCare platform.
It talks to the backend exclusively through the **API Gateway** (`/api/**`).

## Tech Stack

- **React 18** with TypeScript
- **Vite 5** build tooling
- **React Router v6** for client-side routing
- **Nginx** (in Docker) to serve the static build and proxy `/api` to the gateway

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on **http://localhost:3000** and proxies `/api` to the
API Gateway at `http://localhost:8080`, so you only need the backend running.

## Production Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Running in Docker

The frontend is part of the Docker Compose stack (`docker/docker-compose.yml`):

```bash
docker compose -f docker/docker-compose.yml up --build frontend
```

It will be available at **http://localhost:3000** and its nginx will proxy
`/api` requests to the `api-gateway` container.

## Structure

```
frontend/
├── src/
│   ├── api/client.ts       # fetch wrapper with JWT handling
│   ├── components/         # shared UI components (Navbar)
│   ├── pages/              # route-level pages (Home, Login, Register, Dashboard)
│   ├── types/              # shared TypeScript types matching backend DTOs
│   ├── App.tsx             # route definitions
│   └── main.tsx            # entry point
├── index.html
├── vite.config.ts          # dev proxy configuration
├── nginx.conf              # production nginx config
└── Dockerfile              # multi-stage build (node → nginx)
```
