# Aura AI: Smart Life & Finance

Aura AI is an AI-powered personal finance app built with FastAPI, Next.js, PostgreSQL and OpenAI/Anthropic integrations. Users can sign up, log in, describe expenses in natural language, track savings goals and review AI-generated insights in an interactive dashboard.

## Features

- JWT-based authentication with hashed passwords
- Natural-language expense parsing with AI-first and heuristic fallback
- Interactive dashboard with Recharts visualizations
- Financial goal tracking with progress bars
- AI insight generation each time the dashboard is opened
- Dark mode toggle and toast-based validation feedback
- Docker-based deployment for backend, frontend and PostgreSQL

## Tech Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, Pydantic, JWT
- Frontend: Next.js App Router, Tailwind CSS, Recharts, Sonner, next-themes
- AI: OpenAI Responses API and Anthropic Messages API
- Infra: Docker, docker-compose

## Project Structure

```text
.
|-- apps
|   |-- backend
|   |   |-- app
|   |   |   |-- api
|   |   |   |-- core
|   |   |   |-- db
|   |   |   |-- schemas
|   |   |   `-- services
|   |   |-- requirements.txt
|   |   `-- Dockerfile
|   `-- frontend
|       |-- src
|       |   |-- app
|       |   |-- components
|       |   `-- lib
|       |-- package.json
|       `-- Dockerfile
|-- database
|   `-- schema
|-- docker-compose.yml
`-- .env.example
```

## Environment Variables

Create a `.env` file in the repo root based on `.env.example`.

```env
APP_ENV=development
APP_NAME=Aura AI
API_V1_PREFIX=/api/v1
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/aura_ai
BACKEND_CORS_ORIGINS=http://localhost:3000
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Local Development

### 1. Start PostgreSQL

Use local PostgreSQL or start only the database from Docker:

```bash
docker compose up db -d
```

### 2. Run the backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r apps/backend/requirements.txt
uvicorn apps.backend.app.main:app --reload
```

Backend will run on `http://localhost:8000`.

### 3. Run the frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`.

## Docker Deployment

Run the full stack:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

To stop:

```bash
docker compose down
```

To stop and remove database volume:

```bash
docker compose down -v
```

## API Overview

### Auth

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Transactions

- `POST /api/v1/transactions/parse-expense`

Example payload:

```json
{
  "message": "Bugun kofe va tushlik uchun 58 ming so'm sarfladim"
}
```

### Goals

- `POST /api/v1/goals`
- `GET /api/v1/goals`

### Dashboard

- `GET /api/v1/dashboard/summary`

## Production Notes

- Replace `SECRET_KEY` with a strong random secret before deployment.
- In production, set `BACKEND_CORS_ORIGINS` to the real frontend domain.
- `Base.metadata.create_all()` is convenient for development, but Alembic migrations should be used for managed production schema changes.
- AI integrations gracefully fall back to a heuristic parser if API keys are not configured.
- Railway, Render and DigitalOcean are good backend options; Vercel works well for the frontend.
- For the easiest full-public deployment of this repo, see [DEPLOY_RAILWAY.md](/d:/Instagram%20vediolar%20senariysi/data_voice_/DEPLOY_RAILWAY.md).

## QA Checklist

- Sign up creates a new user and redirects to the dashboard.
- Login persists after browser refresh.
- Empty or invalid form submissions show toast feedback.
- Expense parser creates a transaction and refreshes charts.
- Goal creation updates the progress section.
- Dashboard summary loads with AI insight.

## Security Notes

- Passwords are hashed with bcrypt via Passlib.
- JWT verification is enforced on protected endpoints.
- Backend validation errors are normalized into user-safe messages.
- CORS is configurable and credentials are enabled for future cookie upgrades.
- Tokens are currently persisted in local storage for simplicity. For higher-security production environments, upgrading to secure HttpOnly cookies plus refresh tokens is recommended.
