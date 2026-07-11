#!/usr/bin/env bash
set -e

echo "Waiting for postgres at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
until python -c "
import socket, os, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((os.environ.get('POSTGRES_HOST', 'db'), int(os.environ.get('POSTGRES_PORT', 5432))))
except Exception:
    sys.exit(1)
"; do
  sleep 1
done
echo "Postgres is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create a superuser automatically in dev if env vars are provided (optional, safe no-op otherwise)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --noinput || true
fi

exec gunicorn todo_project.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60
