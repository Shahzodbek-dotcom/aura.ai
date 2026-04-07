# Railway Deploy Guide

This is the simplest production path for this repo: one Railway project with 3 services.

## What You Will Create

- `PostgreSQL` service
- `backend` service from this repo using `apps/backend/Dockerfile`
- `frontend` service from this repo using `apps/frontend/Dockerfile`

## Before You Start

1. Push this repo to GitHub.
2. Create a Railway account and connect GitHub.
3. Keep [.env.production.example](/d:/Instagram%20vediolar%20senariysi/data_voice_/.env.production.example) open while adding variables.

## 1. Create the Database

1. In Railway, create a new project.
2. Click `New`.
3. Add `PostgreSQL`.
4. Wait until the database is ready.

Railway will generate the database connection values for you.

## 2. Deploy the Backend

1. Click `New` -> `GitHub Repo`.
2. Select this repository.
3. Open the backend service settings.
4. Set the root directory to `/`.
5. Set the Dockerfile path to `apps/backend/Dockerfile`.
6. Generate a public domain for the backend service.

Add these environment variables to the backend service:

```env
APP_ENV=production
APP_NAME=Aura AI
API_V1_PREFIX=/api/v1
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKEND_CORS_ORIGINS=["https://YOUR_FRONTEND_DOMAIN"]
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

Use the backend health check after deploy:

```text
/health
```

The backend API base URL should look like:

```text
https://YOUR_BACKEND_DOMAIN/api/v1
```

## 3. Deploy the Frontend

1. Add another service from the same GitHub repo.
2. Open the frontend service settings.
3. Set the root directory to `/`.
4. Set the Dockerfile path to `apps/frontend/Dockerfile`.
5. Generate a public domain for the frontend service.

Add this environment variable to the frontend service:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api/v1
```

Important:
The frontend Dockerfile already supports build-time injection for `NEXT_PUBLIC_API_BASE_URL`, so the production frontend will not be stuck on `localhost`.

## 4. Fix Backend CORS

After the frontend domain is created, update the backend variable:

```env
BACKEND_CORS_ORIGINS=["https://YOUR_FRONTEND_DOMAIN"]
```

Redeploy the backend once after updating it.

## 5. Test Production

1. Open the frontend domain.
2. Sign up.
3. Log in.
4. Add an expense.
5. Add a goal.
6. Open the dashboard.

If the frontend opens but the API does not work:

- Check the backend public domain.
- Check `NEXT_PUBLIC_API_BASE_URL`.
- Check `BACKEND_CORS_ORIGINS`.
- Check backend logs.

## Strong Secret Key

You can generate one on Windows PowerShell with:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## What I Cannot Do Automatically

I can prepare the repo and the deploy config, but the final public deployment still requires:

- your GitHub account
- your Railway account
- your approval to connect the repo and create cloud services

Once those are available, follow the steps above and the app will be publicly accessible.
