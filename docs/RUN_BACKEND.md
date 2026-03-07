# How to Run the Backend (Member 2 - Outage System)

Since `member1`, `member3`, and `member4` directories are currently empty, only **Member 2 (Outage System)** can be run.

## Prerequisites

1. **Docker Desktop** installed and running.
2. **Node.js** (v18+) installed.

## Setup Steps

### 1. Start Database and Redis

We use Docker to run PostgreSQL and Redis.
A conflict with a local Postgres instance on port 5432 was detected, so Postgres has been configured to run on **port 5433**.

Open a terminal in the project root and run:

```bash
docker-compose up -d postgres redis
```

### 2. Run Member 2 Backend

The backend is configured to run on **port 8002** to match the Admin Panel configuration.

1. Navigate to the member2 directory:
   ```bash
   cd backend/member2-outage-system
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server should start and show:
```
Database connection established successfully.
Database models synchronized.
Member 2 Outage System running on port 8002
```

## Troubleshooting

- **Port Conflicts**: If port 8002 is in use, edit `backend/member2-outage-system/.env` and change `PORT`.
- **Database Connection**: Ensure the Docker containers are running (`docker ps`). The app connects to `localhost:5433`.
