# Deploying to AWS EC2 (t3 free tier)

> **Free tier note:** AWS's classic 12-month free tier is defined around
> **t2.micro** (750 hrs/month). Since 2023, some accounts/regions offer
> **t3.micro** under the free tier instead — check the "Free tier eligible"
> tag next to the instance type in the launch wizard for your account before
> you launch, so you don't get billed. Either type works fine for this guide;
> both give 1 vCPU / 1 GB RAM, which is enough for this stack but tight
> (see the swap step below).

## 1. Launch the instance

1. EC2 console → **Launch instance**.
2. **AMI**: Ubuntu Server 22.04 LTS (or 24.04), 64-bit (x86).
3. **Instance type**: `t3.micro` (confirm it's tagged free-tier eligible for
   your account, otherwise use `t2.micro`).
4. **Key pair**: create or select one, download the `.pem` file.
5. **Network settings** → Edit security group, add inbound rules:
   | Type  | Port | Source          |
   |-------|------|-----------------|
   | SSH   | 22   | My IP           |
   | HTTP  | 80   | Anywhere (0.0.0.0/0) |
   | HTTPS | 443  | Anywhere (0.0.0.0/0) — only if you'll set up TLS |
6. **Storage**: bump the root volume to 20 GB gp3 (free tier includes up to
   30 GB) — Docker images add up fast on the default 8 GB.
7. Launch, then note the instance's **public IPv4 address**.

## 2. Connect and do base setup

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt update && sudo apt upgrade -y
```

### Add swap (important on 1 GB RAM instances)

The React build step and running Postgres + Django + Nginx together can
exceed 1 GB. A 2 GB swap file prevents the Docker build or `npm run build`
from getting OOM-killed:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # confirm swap is active
```

## 3. Install Docker and Docker Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # or log out/in for the group change to take effect

docker --version
docker compose version
```

## 4. Get the code onto the instance

Either `git clone` your repo, or copy the project from your machine:

```bash
# from your local machine
scp -i your-key.pem -r ./todo-app ubuntu@<EC2_PUBLIC_IP>:~/todo-app
```

```bash
# on the instance
cd ~/todo-app
```

## 5. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set at minimum:

```bash
POSTGRES_PASSWORD=<a strong random password>
DJANGO_SECRET_KEY=<output of: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=<EC2_PUBLIC_IP>,yourdomain.com
DJANGO_CSRF_TRUSTED_ORIGINS=http://<EC2_PUBLIC_IP>,https://yourdomain.com
CORS_ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>,https://yourdomain.com
```

(`DJANGO_ALLOWED_HOSTS` takes bare hostnames; `CSRF_TRUSTED_ORIGINS` and
`CORS_ALLOWED_ORIGINS` need the full scheme, e.g. `https://yourdomain.com`.)

## 6. Build and run

```bash
docker compose up --build -d
docker compose ps          # all three services should be "healthy"/"running"
docker compose logs -f backend   # watch migrations run on first boot
```

Create an admin user for `/admin/`:

```bash
docker compose exec backend python manage.py createsuperuser
```

Visit `http://<EC2_PUBLIC_IP>` — you should see the app. `http://<EC2_PUBLIC_IP>/admin/`
opens Django admin, `http://<EC2_PUBLIC_IP>/api/todos/` returns JSON.

## 7. (Optional) Point a domain and add HTTPS

1. Create an **A record** for your domain pointing to the EC2 public IP.
2. Stop nginx temporarily and grab a certificate with certbot in standalone mode:

   ```bash
   docker compose stop nginx
   sudo apt install -y certbot
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

3. Mount the certs into the nginx container and add a TLS server block. In
   `docker-compose.yml`, add under the `nginx` service:

   ```yaml
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - static_data:/usr/share/nginx/django-static:ro
         - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

4. In `nginx/nginx.conf`, add a redirect and a TLS server block:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       # ... same location blocks as the existing server {} ...
   }
   ```

5. Rebuild and restart: `docker compose up --build -d`.
6. Renew certs periodically (certbot installs a systemd timer by default, or
   add a cron job calling `certbot renew` followed by `docker compose restart nginx`).

## 8. Day-to-day operations

```bash
# View logs
docker compose logs -f

# Redeploy after a code change
git pull   # or re-scp the changed files
docker compose up --build -d

# Run Django management commands
docker compose exec backend python manage.py <command>

# Back up the database
docker compose exec db pg_dump -U <POSTGRES_USER> <POSTGRES_DB> > backup.sql

# Stop everything
docker compose down          # keeps volumes (db data)
docker compose down -v       # also wipes db data — careful
```

## 9. Free-tier resource tips

- `docker compose ps` and `docker stats` help spot memory pressure early.
- Postgres's default `shared_buffers`/`work_mem` are fine at this scale; no
  tuning needed for a small todo app.
- If the React build (`nginx` image build stage) OOMs during `docker compose
  up --build`, the swap file from step 2 should fix it. As a fallback, build
  the frontend on your local machine and `scp` the `frontend/build` output
  instead of building on the instance.
- Set up a CloudWatch billing alarm — free tier covers 750 instance-hours/month
  for a single t2.micro/t3.micro, but forgetting to stop *extra* instances or
  attaching extra EBS volumes can incur small charges.
