# Daily Tasks

A simple todo app built with React, Express, Node.js, and MongoDB.

## Run with Docker Compose

Requirements: Docker Engine and the Docker Compose v2 plugin.

From the project root:

```powershell
docker compose up --build
```

Open `http://localhost:8080`. Compose starts the React app served by Nginx, the Express API, and MongoDB. MongoDB data is stored in the `mongo-data` named volume. To stop the app, run `docker compose down`; the data volume is preserved. To also remove saved data, run `docker compose down --volumes`.

Set `FRONTEND_PORT` in the environment to change the host port (for example, `$env:FRONTEND_PORT=8081` in PowerShell).

## Run locally without Docker

Requirements: Node.js 22.12+ and a running MongoDB server.

1. Start MongoDB. In `backend`, copy `.env.example` to `.env` and set `MONGODB_URI` if needed.
2. In one terminal, run the API: `cd backend; npm install; npm run dev`.
3. In another terminal, run the frontend: `cd frontend; npm install; npm run dev`.
4. Open the Vite URL (normally `http://localhost:5173`).

The local Vite server proxies `/api` requests to `http://localhost:5000`.

## API

- `GET /api/todos` — list todos
- `GET /api/health` — API and database health status
- `POST /api/todos` — create a todo with `{ "title": "..." }`
- `PATCH /api/todos/:id` — update `title` and/or `completed`
- `DELETE /api/todos/:id` — delete a todo

## Jenkins

The root `Jenkinsfile` builds the Compose images, starts the services, checks the frontend and API health endpoint, runs todo CRUD smoke tests, and removes the CI containers afterward. Configure a Jenkins agent with Docker Engine access and Docker Compose v2, then create a Pipeline job that loads this `Jenkinsfile` from source control. The pipeline uses a unique Compose project name per build and the default frontend port `8080`; ensure that port is available on the agent.
