# Deploy Habify — Neon (DB) · Render (API) · Vercel (Frontend)

## Production URLs (live)

| Service | URL |
| :--- | :--- |
| **Frontend** | [https://habify-hkox.vercel.app](https://habify-hkox.vercel.app/) |
| **Backend API** | [https://habify-1-vsl4.onrender.com](https://habify-1-vsl4.onrender.com) |
| **Health check** | [https://habify-1-vsl4.onrender.com/actuator/health](https://habify-1-vsl4.onrender.com/actuator/health) |

The frontend production build reads **`VITE_API_BASE_URL`** from `.env.production` (also settable in Vercel).  
The backend must allow the Vercel origin via **`CORS_ALLOWED_ORIGINS`** on Render.

---

## Architecture

```
Browser (Vercel)  →  VITE_API_BASE_URL  →  Spring Boot (Render)  →  Neon PostgreSQL
```

| Layer | Host | Env file / dashboard |
| :--- | :--- | :--- |
| Frontend | **Vercel** | Root `.env` / Vercel Project → Environment Variables |
| Backend | **Render** | `backend/.env` locally / Render → Environment |
| Database | **Neon** | Connection string → `SPRING_DATASOURCE_*` on Render |

---

## 1. Neon (already created)

In Neon Console → your project → **Connection details** → choose **JDBC**:

| Variable | Example |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-….neon.tech/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` | *(your Neon password)* |

Locally these live in **`backend/.env`** (gitignored).  
On Render, paste the same three values into the service Environment tab.

---

## 2. Backend on Render (Docker)

### Recommended settings (Web Service → Docker)

| Setting | Value |
| :--- | :--- |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Health Check Path | `/actuator/health` |

There is also a root `Dockerfile` if you leave Root Directory empty (builds `backend/` from the monorepo).

### Environment variables (Render dashboard)

Paste your Neon JDBC values and CORS (see table in section 5). Render sets `PORT` automatically.

### Or use the Blueprint

Connect the repo and apply `render.yaml`, then fill in the `sync: false` secrets.

Free Render services sleep when idle; first request after sleep can take ~30–60s.

---

## 3. Frontend on Vercel

1. Import the repo → Framework **Vite** → Root directory = repo root  
2. Build: `npm run build` · Output: `dist`  
3. Environment variable:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://habify-1-vsl4.onrender.com/api` |

This is already in **`.env.production`** in the repo — Vercel picks it up on build.  
You can also set the same value in Vercel → Project → Environment Variables (overrides the file).

4. On **Render**, set `CORS_ALLOWED_ORIGINS` to:

```text
https://habify-hkox.vercel.app,https://*.vercel.app,http://localhost:3000,http://localhost:5173
```

Then redeploy the backend if you change CORS.

`vercel.json` already rewrites SPA routes to `index.html`.

---

## 4. Local development (split envs)

```bash
# Frontend — root
cp .env.example .env
npm install
npm run dev          # http://localhost:3000  (proxies /api → :8080)

# Backend — backend/
cp backend/.env.example backend/.env
# Paste Neon JDBC values into backend/.env
cd backend
mvn spring-boot:run  # http://localhost:8080
```

- Frontend reads only **`VITE_*`** from root `.env`  
- Backend reads **`SPRING_*` / `JWT_*` / `CORS_*`** from `backend/.env` (via spring-dotenv) or the process environment  

---

## 5. Variable cheat sheet

### Frontend (Vercel / root `.env`)

| Variable | Local | Production |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | `https://habify-1-vsl4.onrender.com/api` |

### Backend (Render / `backend/.env`)

| Variable | Purpose |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | Neon JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Neon user |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `JWT_SECRET` | Token signing key |
| `JWT_EXPIRATION_MS` | Token lifetime (ms) |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins |
| `SERVER_PORT` / `PORT` | Listen port |

---

## 6. Verify

1. `https://YOUR-API.onrender.com/actuator/health` → `{"status":"UP"}`  
2. Open Vercel site → browse should show **Live API** when the backend is awake  
3. Login with demo users from `RUNNING.md`  

Never commit `backend/.env` or production secrets. Only commit `.env.example` files.
