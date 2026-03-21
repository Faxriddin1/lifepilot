# Quick Deployment Checklist

## Pre-Deployment (One-Time Setup)

### 1. Generate SSH Keys
```powershell
# On Windows
powershell -ExecutionPolicy Bypass -File .github/scripts/setup-ssh-keys.ps1

# On Mac/Linux
bash .github/scripts/setup-ssh-keys.sh
```

- [ ] SSH keys generated at `~/.ssh/github-deploy`
- [ ] Public key saved/copied
- [ ] Known hosts retrieved

### 2. Add Public Key to Google Cloud VM

**Option A: Via SSH (if you have access)**
```bash
ssh root@34.122.146.176
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAA... your-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

**Option B: Via gcloud CLI**
```bash
gcloud compute instances add-metadata lifepilot-vm \
  --metadata-from-file ssh-keys=~/.ssh/github-deploy.pub
```

- [ ] Public key added to VM's `~/.ssh/authorized_keys`
- [ ] SSH connection tested: `ssh -i ~/.ssh/github-deploy root@34.122.146.176`

### 3. Add GitHub Secrets
Go to: **https://github.com/Faxriddin1/productflow/settings/secrets/actions**

Add these 4 secrets:

| Secret | Value |
|--------|-------|
| **GCP_VM_HOST** | `34.122.146.176` |
| **GCP_VM_USER** | `root` |
| **GCP_SSH_KEY** | Private key content (from `~/.ssh/github-deploy`) |
| **GCP_SSH_KNOWN_HOSTS** | Known hosts (from ssh-keyscan output) |

**Optional:**
| **SLACK_WEBHOOK** | Your Slack webhook URL (for notifications) |

- [ ] All 4 required secrets added
- [ ] Secrets verified (no typos in values)

### 4. Setup Google Cloud VM

**Option A: Automatic Setup**
```bash
# Download and run setup script on the VM
curl -O https://raw.githubusercontent.com/Faxriddin1/productflow/main/.github/scripts/setup-gcp-vm.sh
bash setup-gcp-vm.sh
```

**Option B: Manual Setup** (follow GCP_DEPLOYMENT_GUIDE.md)

- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Repository cloned to `/opt/lifepilot`
- [ ] `.env` file created with production values
- [ ] Initial `docker-compose up -d` successful
- [ ] Database migrations run: `docker-compose exec backend python manage.py migrate`

### 5. Configure Production Environment

On the Google Cloud VM, edit `/opt/lifepilot/.env`:

**Critical Settings:**
```env
DEBUG=False
SECRET_KEY=your-secure-random-string
ALLOWED_HOSTS=lifepilot.uz,34.122.146.176
CORS_ALLOWED_ORIGINS=https://lifepilot.uz

DB_PASSWORD=secure-password
REDIS_URL=redis://redis:6379/0

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

- [ ] DEBUG is set to `False`
- [ ] SECRET_KEY is a random, secure string
- [ ] Database credentials are set
- [ ] Google OAuth credentials configured
- [ ] ALLOWED_HOSTS includes your domain

---

## Deployment

### Option 1: Automatic via GitHub Actions

1. Go to: **Actions → Deploy to Production**
2. Click **"Run workflow"**
3. Monitor the deployment in real-time

Timeline:
- Deploy starts
- Pull latest code from `main`
- Rebuild Docker images
- Restart containers
- Run migrations
- Health checks
- Complete ✅

### Option 2: Manual via SSH

```bash
ssh -i ~/.ssh/github-deploy root@34.122.146.176

cd /opt/lifepilot
git pull origin main
docker-compose down
docker-compose pull
docker-compose up -d --build
docker-compose exec backend python manage.py migrate

# Check status
docker-compose ps
```

---

## Post-Deployment

### Verify Deployment

```bash
# 1. Check containers are running
ssh root@34.122.146.176 "docker-compose ps"

# 2. Check logs for errors
ssh root@34.122.146.176 "docker-compose logs backend | tail -50"

# 3. Test API endpoint
curl -X GET http://34.122.146.176:8000/api/v1/auth/me/

# 4. Visit the app
# Open: http://34.122.146.176:3000
# Or:   https://lifepilot.uz (if SSL configured)
```

- [ ] All containers show "Up" status
- [ ] No error messages in logs
- [ ] API responds to requests
- [ ] Frontend loads without errors

### Common Issues & Fixes

**Issue: Connection refused**
```bash
# Check SSH key permissions
ls -la ~/.ssh/github-deploy
# Should be: -rw------- (600)

# Test connection
ssh -v -i ~/.ssh/github-deploy root@34.122.146.176
```

**Issue: Docker command not found**
```bash
# SSH into VM and check
docker --version
docker-compose --version

# If not installed, run setup script again
bash setup-gcp-vm.sh
```

**Issue: Database migration failed**
```bash
# SSH into VM
ssh root@34.122.146.176

# Check database status
docker-compose exec db psql -U postgres -litres: /opt/lifepilot

# View full logs
docker-compose logs db
```

**Issue: Frontend still showing old version**
```bash
# Force rebuild
docker-compose build --no-cache frontend
docker-compose restart frontend

# Or full restart
docker-compose down
docker-compose up -d --build
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# At least check these once a day:
ssh root@34.122.146.176 << 'EOF'
  echo "Checking containers..."
  docker-compose ps
  
  echo "Checking for errors in last hour..."
  docker-compose logs --since 1h backend | grep -i error || echo "No errors"
EOF
```

### Weekly Tasks

```bash
# Update containers
docker-compose pull
docker-compose restart

# Backup database
docker-compose exec db pg_dump -U postgres lifepilot > backup-$(date +%Y%m%d).sql

# Check disk space
df -h
docker system df
```

### Monthly Tasks

```bash
# Clean up old Docker images
docker system prune -a

# Update system packages
apt-get update && apt-get upgrade -y

# Review and rotate logs
journalctl --vacuum=30d
```

---

## Rollback Procedure

If deployment breaks production:

```bash
# SSH into VM
ssh root@34.122.146.176
cd /opt/lifepilot

# Revert to previous commit
git log --oneline | head -5
git revert HEAD

# Or revert to specific commit
git checkout <commit-hash>

# Rebuild and restart
docker-compose down
docker-compose up -d --build
docker-compose exec backend python manage.py migrate
```

---

## SSL/HTTPS Setup (Optional but Recommended)

```bash
# SSH into VM
ssh root@34.122.146.176

# Install and configure SSL
certbot certonly --standalone -d lifepilot.uz --email admin@lifepilot.uz

# Update Nginx config
nano /etc/nginx/sites-enabled/lifepilot.conf

# Test and reload
nginx -t
systemctl reload nginx

# Auto-renewal check
certbot renew --dry-run
```

---

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View just backend logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail 100 backend

# Execute command in container
docker-compose exec backend python manage.py shell

# Stop services
docker-compose stop

# Restart specific service
docker-compose restart backend

# View resource usage
docker stats

# Check network
docker network ls

# Database shell
docker-compose exec db psql -U postgres lifepilot
```

---

## Emergency Contacts & Resources

- **GitHub Issues**: https://github.com/Faxriddin1/productflow/issues
- **Deployment Guide**: `.github/GCP_DEPLOYMENT_GUIDE.md`
- **CI/CD Setup**: `.github/GITHUB_ACTIONS_SETUP.md`
- **Backend**: http://34.122.146.176:8000
- **Frontend**: http://34.122.146.176:3000
- **Admin Panel**: http://34.122.146.176:3000/admin

---

## Sign-Off

- [ ] Pre-deployment checklist completed
- [ ] All secrets added to GitHub
- [ ] VM is configured and tested
- [ ] First deployment triggered successfully
- [ ] Post-deployment verification passed
- [ ] Monitoring and alerts configured

**Date Deployed**: ___________
**Deployed By**: ___________
**Version**: ___________
