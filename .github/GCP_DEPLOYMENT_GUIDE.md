# Google Cloud VM Deployment Guide

## Prerequisites

- Google Cloud VM: `34.122.146.176`
- Project: LifePilot
- Docker & Docker Compose installed

## Step 1: SSH Setup

### Generate SSH Key for Deployment (if you don't have one)

```bash
# On your local machine
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -C "github-actions-deploy" -N ""

# This creates two files:
# ~/.ssh/github-deploy (private key - keep secret)
# ~/.ssh/github-deploy.pub (public key - add to VM)
```

### Add Public Key to Google Cloud VM

**Option A: Via gcloud CLI (recommended)**
```bash
gcloud compute instances add-metadata lifepilot-vm \
  --metadata-from-file ssh-keys=<(echo "YOUR_USERNAME:$(cat ~/.ssh/github-deploy.pub)")
```

**Option B: Via SSH (if you already have access)**
```bash
# SSH into the VM
gcloud compute ssh lifepilot --zone=YOUR_ZONE

# Or if using Linux/Mac
ssh root@34.122.146.176

# Then add the key
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAA... your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Test SSH Connection

```bash
# Test from your local machine
ssh -i ~/.ssh/github-deploy root@34.122.146.176 "echo 'SSH works!'"

# Or with your username
ssh -i ~/.ssh/github-deploy YOUR_USERNAME@34.122.146.176 "echo 'SSH works!'"
```

## Step 2: Prepare Google Cloud VM

### Connect to VM

```bash
# Via gcloud
gcloud compute ssh lifepilot --zone=YOUR_ZONE

# Or directly
ssh -i ~/.ssh/github-deploy root@34.122.146.176
```

### Install Docker & Docker Compose (if not already installed)

```bash
# Update system packages
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y docker.io

# Install Docker Compose (v2)
apt-get install -y docker-compose-plugin

# Or install standalone docker-compose (older method)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker daemon
systemctl start docker
systemctl enable docker

# Add current user to docker group (optional, for non-root)
usermod -aG docker $USER
newgrp docker
```

### Verify Docker Installation

```bash
docker --version
docker-compose --version
docker ps
```

### Clone Repository to VM

```bash
# Create deployment directory
mkdir -p /opt/lifepilot
cd /opt/lifepilot

# Clone the repository
git clone https://github.com/Faxriddin1/productflow.git .

# Or if already cloned, pull latest
git pull origin main
```

### Create Environment File

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit with your production values
nano .env
```

**Ensure .env has:**
```
DEBUG=False
SECRET_KEY=your-secure-random-string-here
ALLOWED_HOSTS=lifepilot.uz,34.122.146.176,localhost
CORS_ALLOWED_ORIGINS=https://lifepilot.uz,http://34.122.146.176

DB_NAME=lifepilot
DB_USER=postgres
DB_PASSWORD=your-secure-db-password
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# For email notifications (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Initial Docker Compose Up

```bash
cd /opt/lifepilot

# Build and start containers
docker-compose up -d --build

# Check if all services are running
docker-compose ps

# View logs
docker-compose logs -f backend

# Run migrations manually first time
docker-compose exec backend python manage.py migrate

# Create default categories
docker-compose exec backend python manage.py create_default_categories --skip-existing

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

## Step 3: Configure GitHub Secrets

Go to your GitHub repository: **Settings → Secrets and variables → Actions**

Add the following secrets:

### Required SSH Secrets

1. **GCP_VM_HOST**
   - Value: `34.122.146.176`

2. **GCP_VM_USER**
   - Value: Root user (usually `root`) or your username

3. **GCP_SSH_KEY**
   - Value: Contents of `~/.ssh/github-deploy` (the PRIVATE key)
   - Command to copy:
     ```bash
     cat ~/.ssh/github-deploy | pbcopy  # macOS
     cat ~/.ssh/github-deploy | xclip -selection clipboard  # Linux
     # On Windows: Get-Content ~/.ssh/github-deploy | Set-Clipboard
     ```

4. **GCP_SSH_KNOWN_HOSTS**
   - Value: SSH host keys for the VM
   - Get via:
     ```bash
     ssh-keyscan -t ed25519,rsa,ecdsa 34.122.146.176
     ```
   - Or:
     ```bash
     ssh-keyscan 34.122.146.176
     ```

### Optional: Slack Notifications

5. **SLACK_WEBHOOK**
   - Get from: https://api.slack.com/messaging/webhooks
   - Create incoming webhook for your Slack workspace

## Step 4: Firewall & Networking

### Open Required Ports on Google Cloud

```bash
# Via gcloud CLI
gcloud compute firewall-rules create allow-web \
  --allow tcp:80,tcp:443 \
  --target-tags=http-server,https-server

gcloud compute firewall-rules create allow-ssh \
  --allow tcp:22 \
  --target-tags=ssh
```

### Or via Google Cloud Console
1. Go to **VPC network → Firewall**
2. Create rules for:
   - Port 22 (SSH) - for your IP or 0.0.0.0/0
   - Port 80 (HTTP) - 0.0.0.0/0
   - Port 443 (HTTPS) - 0.0.0.0/0

## Step 5: SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
apt-get install -y certbot python3-certbot-nginx

# Or for standalone
apt-get install -y certbot
```

### Generate Certificate

```bash
# Standalone mode (stops web servers temporarily)
certbot certonly --standalone -d lifepilot.uz --email admin@lifepilot.uz

# Or with DNS validation
certbot certonly --manual -d lifepilot.uz
```

### Update docker-compose.yml

```yaml
# Add volume for certs
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro

# Update nginx config in your reverse proxy
```

## Step 6: Nginx Reverse Proxy (Optional)

### Create Nginx config

```bash
nano /etc/nginx/sites-enabled/lifepilot.conf
```

**Configuration:**
```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name lifepilot.uz 34.122.146.176;
    
    client_max_body_size 10M;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lifepilot.uz 34.122.146.176;

    ssl_certificate /etc/letsencrypt/live/lifepilot.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lifepilot.uz/privkey.pem;

    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin
    location /admin/ {
        proxy_pass http://backend:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Test and Reload Nginx

```bash
nginx -t
systemctl reload nginx
```

## Step 7: Deploy via GitHub Actions

### Trigger Manual Deployment

1. Go to GitHub: **Actions → Deploy to Production → Run workflow**
2. Click "Run workflow"
3. Monitor the deployment in real-time

### Or Deploy Manually via SSH

```bash
# Connect to VM
ssh -i ~/.ssh/github-deploy root@34.122.146.176

# Go to project directory
cd /opt/lifepilot

# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose pull
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Check status
docker-compose ps
```

## Step 8: Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail 100 backend
```

### Check Service Health

```bash
# Check running containers
docker-compose ps

# Check resource usage
docker stats

# Restart a service
docker-compose restart backend

# Restart all services
docker-compose restart
```

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec db pg_dump -U postgres lifepilot > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
cat backup-20260321-120000.sql | docker-compose exec -T db psql -U postgres lifepilot
```

## Troubleshooting

### SSH Connection Fails

```bash
# Check SSH permissions on VM
ssh -i ~/.ssh/github-deploy root@34.122.146.176 "ls -la ~/.ssh"
# Should show: -rw-r--r-- authorized_keys

# If not, fix permissions
ssh root@34.122.146.176
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Docker Compose Commands Not Found

```bash
# Check Docker status
docker ps

# Install Docker Compose
apt-get install -y docker-compose-plugin

# Or use docker compose (v2 syntax)
docker compose up -d
```

### Database Connection Issues

```bash
# Check if db service is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Check connection from backend
docker-compose exec backend python manage.py dbshell
```

### Frontend Not Reachable

```bash
# Check nginx status
systemctl status nginx

# Restart nginx
systemctl restart nginx

# Check logs
tail -f /var/log/nginx/error.log
```

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000
# Or on macOS
lsof -i :8000

# Kill process
kill -9 PID

# Or change port in docker-compose.yml
```

## Security Checklist

- [x] SSH key authentication (not password)
- [x] Firewall rules configured
- [x] SSL certificates installed
- [x] DEBUG=False in production
- [x] ALLOWED_HOSTS configured
- [x] CORS properly scoped
- [x] Regular backups enabled
- [x] Logs monitored
- [x] Rate limiting enabled
- [x] HTTPS enforced

## Regular Maintenance

```bash
# Weekly: Check logs for errors
docker-compose logs backend | grep -i error

# Monthly: Update dependencies
docker-compose pull
docker-compose up -d --build

# Monthly: Backup database
docker-compose exec db pg_dump -U postgres lifepilot > backup-$(date +%Y%m%d).sql

# Quarterly: Review security updates
apt-get update && apt-get upgrade -y
```

## Next Steps

1. ✅ Generate SSH keys
2. ✅ Add public key to VM
3. ✅ Configure GitHub Secrets
4. ✅ Test SSH connection from local machine
5. ✅ Prepare .env file on VM
6. ✅ Run initial Docker Compose setup
7. ✅ Configure Nginx (optional)
8. ✅ Set up SSL (optional but recommended)
9. ✅ Trigger first deployment via GitHub Actions
10. ✅ Monitor logs and status

## Support

For issues, check:
- Docker logs: `docker-compose logs -f`
- GitHub Actions logs: https://github.com/Faxriddin1/productflow/actions
- VM system logs: `sudo journalctl -xe`
