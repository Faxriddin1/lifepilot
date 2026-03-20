# GitHub Actions Setup Guide

## Required GitHub Secrets

Add the following secrets to your GitHub repository settings (`Settings → Secrets and variables → Actions`):

### SSH Deployment Secrets

1. **GCP_VM_HOST** (Host)
   - Value: `34.122.146.176`
   - Description: IP address of your Google Cloud VM

2. **GCP_VM_USER** (Username)
   - Value: Your Linux username on the VM (e.g., `ubuntu`, `root`)
   - Description: SSH username for deployment

3. **GCP_SSH_KEY** (Private SSH Key)
   - Generate a new SSH key on your local machine:
     ```bash
     ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -C "github-deploy"
     ```
   - Copy the **private key** (from `~/.ssh/github-deploy`) to this secret
   - Add the **public key** (`~/.ssh/github-deploy.pub`) to your VM's `~/.ssh/authorized_keys`
   - **⚠️ IMPORTANT:** Never share the private key!

4. **GCP_SSH_KNOWN_HOSTS** (SSH Host Keys)
   - Get the SSH host key from your VM first:
     ```bash
     ssh-keyscan -t ed25519,rsa 34.122.146.176
     ```
   - Copy the output to this secret
   - Or run this once to add to your local known_hosts:
     ```bash
     ssh-keyscan -H 34.122.146.176 >> ~/.ssh/known_hosts
     ```

### Optional Secrets

5. **SLACK_WEBHOOK** (Slack Webhook URL)
   - For Slack deployment notifications
   - Create at: https://api.slack.com/messaging/webhooks
   - This is optional; remove the Slack notification step from `deploy.yml` if not using

## Step-by-Step Setup on Google Cloud VM

```bash
# 1. SSH into your VM
ssh -i your-private-key root@34.122.146.176
# or
gcloud compute ssh <instance-name> --zone=<zone>

# 2. Create deployment directory
mkdir -p ~/lifepilot
cd ~/lifepilot

# 3. Clone your GitHub repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# 4. Create authorized_keys for deployment
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAA... your-github-deploy-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 5. Test SSH login from your local machine
ssh -i ~/.ssh/github-deploy ubuntu@34.122.146.176 "echo 'SSH works!'"
```

## How It Works

### CI Pipeline (`ci.yml`)
Runs automatically on every `push` to `main` or `develop` branches:
- ✅ Database migrations
- ✅ Backend dependency checks
- ✅ Frontend build verification
- ✅ Security secret scanning

### Deploy Pipeline (`deploy.yml`)
Runs automatically when changes are pushed to `main`:
1. SSH connects to the VM
2. Pulls latest code from GitHub
3. Restarts Docker containers
4. Runs migrations
5. Verifies health checks
6. Sends Slack notification (optional)

### Manual Deployment
You can manually trigger deployment via GitHub UI:
- Go to `Actions → Deploy to Production → Run workflow`

## Troubleshooting

### SSH Connection Failed
```bash
# Check SSH key configuration
ssh -i ~/.ssh/github-deploy -v ubuntu@34.122.146.176

# Verify authorized_keys on VM
cat ~/.ssh/authorized_keys

# Check permissions
ls -la ~/.ssh/
# Should show: -rw-r--r-- authorized_keys
```

### Docker Commands Not Found
- Ensure Docker is installed on the VM
- User running SSH commands should have Docker permissions:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### Migrations Fail
- Check database credentials in `.env` on the VM
- Verify PostgreSQL and Redis are running:
  ```bash
  docker-compose ps
  ```

### View Deployment Logs
- In GitHub: `Actions → [specific workflow run]`
- On VM: `docker-compose logs backend` or `docker-compose logs`

## Environment Variables Setup

Ensure `.env` file exists on your production VM with:
```
DEBUG=False
SECRET_KEY=your-production-secret-key
DB_NAME=lifepilot
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=lifepilot.uz,34.122.146.176
CORS_ALLOWED_ORIGINS=https://lifepilot.uz
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Security Best Practices

1. ✅ Use GitHub Secrets for sensitive data
2. ✅ Use SSH keys instead of passwords (already configured)
3. ✅ Limit SSH key permissions (added to deploy workflow)
4. ✅ Use `.env.example` for non-sensitive defaults
5. ✅ Never commit `.env` file
6. ✅ Review workflow steps before first deployment
7. ✅ Use unique SSH keys per deployment method

## Next Steps

1. Add GitHub Secrets as described above
2. Test SSH connection manually first
3. Trigger a manual deployment via GitHub Actions UI
4. Monitor the deployment in the Actions tab
5. Verify changes on https://lifepilot.uz
