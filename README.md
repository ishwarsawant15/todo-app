# Ledger — To-Do App

Django REST Framework backend + React frontend + PostgreSQL, fronted by a single
Nginx container that serves the built React app and reverse-proxies `/api/` and
`/admin/` to Django. Designed to run comfortably on an AWS EC2 free-tier instance.

```
┌────────────┐      ┌──────────────────────┐      ┌─────────────┐
│  Browser   │ ───▶ │  nginx (port 80)     │ ───▶ │  backend    │
│            │      │  - serves React build │      │  (gunicorn, │
│            │      │  - proxies /api,/admin│      │   Django)   │
└────────────┘      └──────────────────────┘      └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │  db          │
                                                    │  (postgres)  │
                                                    └─────────────┘
```

## Project layout

```
todo-app/
├── backend/          Django + DRF API (todos app: CRUD + toggle)
├── frontend/          React app (create-react-app)
├── nginx/              Nginx Dockerfile + config, builds the React app too
├── docker-compose.yml
├── .env.example        Copy to .env and fill in secrets
└── DEPLOYMENT.md       Step-by-step AWS EC2 (t3 free tier) deployment guide
```

## Run it locally with Docker

1. Install Docker and Docker Compose.
2. Copy the env file and fill in values:
   ```bash
   cp .env.example .env
   ```
3. Build and start everything:
   ```bash
   docker compose up --build
   ```
4. Visit `http://localhost` — the app is served there. The API lives at
   `http://localhost/api/todos/` and the Django admin at `http://localhost/admin/`.
5. Create an admin user (if you didn't set the auto-create env vars):
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

## API

| Method | Path                     | Description               |
|--------|--------------------------|----------------------------|
| GET    | `/api/todos/`             | List todos (`?completed=true`, `?search=`) |
| POST   | `/api/todos/`             | Create a todo              |
| GET    | `/api/todos/{id}/`        | Retrieve one               |
| PATCH  | `/api/todos/{id}/`        | Partial update              |
| DELETE | `/api/todos/{id}/`        | Delete                      |
| POST   | `/api/todos/{id}/toggle/` | Flip `completed`            |

## Run the frontend/backend without Docker (plain dev)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# point POSTGRES_HOST at a local/dev postgres, or install one via your OS package manager
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend (separate terminal)
cd frontend
npm install
npm start   # talks to :8000 via the "proxy" field in package.json
```

## Deploying to AWS EC2 (t3 free tier)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a full walkthrough: launching the
instance, security groups, installing Docker, HTTPS with Let's Encrypt, and
low-memory tuning for the free-tier instance size.
"# todo-app" 
