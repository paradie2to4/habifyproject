# Deploy Habify — Neon (DB) · Render (API) · Vercel (Frontend)

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

## 2. Backend on Render

1. New → **Web Service** → connect this repo  
   - Root directory / Docker context: **`backend`**  
   - Dockerfile: **`backend/Dockerfile`**  
   - Or use `render.yaml` at the repo root (Blueprint).
2. Health check path: **`/actuator/health`**
3. Set environment variables:

| Key | Required | Notes |
| :--- | :---: | :--- |
| `SPRING_DATASOURCE_URL` | yes | Neon JDBC URL with `?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | yes | Neon user |
| `SPRING_DATASOURCE_PASSWORD` | yes | Neon password |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | | `update` |
| `SPRING_PROFILES_ACTIVE` | | `prod` |
| `JWT_SECRET` | yes | Long random string (32+ chars) |
| `JWT_EXPIRATION_MS` | | `86400000` (1 day) |
| `CORS_ALLOWED_ORIGINS` | yes | Your Vercel URL(s), comma-separated |
| `PORT` | | Set automatically by Render |

Example `CORS_ALLOWED_ORIGINS` after Vercel is live:

```text
https://habify.vercel.app,https://*.vercel.app,http://localhost:3000
```

4. Deploy → note the public URL, e.g. `https://habify-api.onrender.com`

Free Render services sleep when idle; first request after sleep can take ~30–60s.

---

## 3. Frontend on Vercel

1. Import the repo → Framework **Vite** → Root directory = repo root  
2. Build: `npm run build` · Output: `dist`  
3. Environment variable:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://habify-api.onrender.com/api` |

Use your real Render hostname. Must include **`/api`**.

4. Deploy. Then update Render `CORS_ALLOWED_ORIGINS` to include `https://your-app.vercel.app`.

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
| `VITE_API_BASE_URL` | `/api` | `https://YOUR-API.onrender.com/api` |

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
