# Running Smart Rental (Habify) — Step-by-Step Guide

This guide provides simple, step-by-step instructions for anyone running the project locally for the first time.

---

## ⚡ Option 1: Quickstart (React Client & Interactive Mock Engine)

The frontend contains a full-fidelity client application with built-in reactive simulation of the Java Spring Boot matching algorithms, PostgreSQL seed dataset, authentication states, and dashboard flows.

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **bun** or **yarn**

### 2. Install & Run
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## ☕ Option 2: Running with Java 21 & Spring Boot Backend

### 1. Prerequisites
- **Java Development Kit (JDK 21+)** (e.g. Eclipse Temurin 21)
- **Maven 3.9+**
- **PostgreSQL 15+** (Optional: the backend also supports in-memory H2 mode if PostgreSQL is not installed)

### 2. Setup PostgreSQL (If using local DB)
```sql
CREATE DATABASE smart_rental_db;
CREATE USER smart_rental_user WITH PASSWORD 'smart_rental_secret_password';
GRANT ALL PRIVILEGES ON DATABASE smart_rental_db TO smart_rental_user;
```

### 3. Configure Environment Variables (split frontend / backend)

```bash
# Frontend (Vercel later) — only VITE_* keys
cp .env.example .env

# Backend (Render + Neon later) — DB, JWT, CORS
cp backend/.env.example backend/.env
# Edit backend/.env with your Neon JDBC URL, user, and password
```

See **[DEPLOY.md](./DEPLOY.md)** for Neon → Render → Vercel production setup.

### 4. Run the Backend
```bash
cd backend

# Run automated tests to verify math & business logic
mvn test

# Start the Spring Boot application (loads backend/.env, default port: 8080)
mvn spring-boot:run
```

The Spring Boot backend will start at: **`http://localhost:8080`**  
- Health check: `http://localhost:8080/actuator/health`

Then in another terminal from the repo root: `npm run dev` (proxies `/api` to the backend).

---

## 🐳 Option 3: Running with Docker Compose (One-Command Setup)

If you have **Docker** and **Docker Compose** installed:

```bash
# Start PostgreSQL database and Spring Boot backend in containers
docker-compose up --build -d

# Check running status
docker-compose ps

# View backend logs
docker-compose logs -f backend
```

To stop:
```bash
docker-compose down
```

---

## 🔑 Default Demo Accounts (Pre-configured)

Use these accounts to explore role-specific experiences:

| Role | Name | Email | Password | What to Test |
| :--- | :--- | :--- | :--- | :--- |
| **TENANT** | Claire Mukamana | `tenant@smartrental.rw` | `password123` | Smart recommendations, custom weights, affordability gauge, viewing requests |
| **LANDLORD** | Jean-Paul Habimana | `landlord@smartrental.rw` | `password123` | Listing quality score (0-100%), add/edit properties, approve/reject viewing tours |
| **ADMIN** | Alex Kayitare | `admin@smartrental.rw` | `password123` | System metrics, user governance, fraudulent listing moderation |

*Tip: You can also use the interactive **Role Switcher Bar** at the top of the app to switch personas instantly with 1-click.*

When both `npm run dev` and `mvn spring-boot:run` are up, the browse page shows a **Live API** badge and loads listings from PostgreSQL. If the backend is down, the UI falls back to local demo data automatically.

---

## 🧪 Running Automated Tests

```bash
# Run backend JUnit 5 tests (Smart Matching, Affordability, Listing Quality)
cd backend
mvn test

# Run frontend typechecks and linting
npm run lint
```
