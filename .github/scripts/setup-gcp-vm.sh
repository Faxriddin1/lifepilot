#!/bin/bash

# Google Cloud VM Setup Script
# Run this on your Google Cloud VM to prepare it for deployment
# Usage: bash setup-gcp-vm.sh

set -e

echo "🚀 LifePilot Google Cloud VM Setup"
echo "===================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root (use sudo)"
  exit 1
fi

# Step 1: Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Step 2: Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
  apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  echo \
    "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

  systemctl start docker
  systemctl enable docker
  echo "✓ Docker installed"
else
  echo "✓ Docker already installed"
fi

# Step 3: Install Docker Compose (standalone for compatibility)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d'"' -f4)
  curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  echo "✓ Docker Compose installed"
else
  echo "✓ Docker Compose already installed"
fi

# Step 4: Install Git
echo "📥 Installing Git..."
apt-get install -y git
echo "✓ Git installed"

# Step 5: Install Nginx (for reverse proxy)
echo "🌐 Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo "✓ Nginx installed"

# Step 6: Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx
echo "✓ Certbot installed"

# Step 7: Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /opt/lifepilot
cd /opt/lifepilot

# Step 8: Clone repository if not exists
if [ ! -d ".git" ]; then
  echo "📚 Cloning repository..."
  git clone https://github.com/Faxriddin1/productflow.git .
else
  echo "📚 Repository already exists, pulling latest..."
  git pull origin main
fi

# Step 9: Create .env from example
echo "⚙️  Setting up environment variables..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  IMPORTANT: Edit /opt/lifepilot/.env with your production values:"
  echo "   - SECRET_KEY (generate: openssl rand -base64 32)"
  echo "   - DB_PASSWORD (generate: openssl rand -base64 16)"
  echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
  echo "   - ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS"
  echo ""
  echo "   Edit command: nano /opt/lifepilot/.env"
else
  echo "✓ .env file already exists"
fi

# Step 10: Test Docker
echo "🧪 Testing Docker..."
docker --version
docker-compose --version
echo "✓ Docker is working"

# Step 11: Build images
echo "🔨 Building Docker images (this may take a few minutes)..."
cd /opt/lifepilot
docker-compose build

# Step 12: Start services
echo "🚀 Starting services..."
docker-compose up -d
sleep 10

# Step 13: Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend python manage.py migrate || echo "⚠️  Migrations may need manual intervention"

# Step 14: Create default categories
echo "📂 Creating default categories..."
docker-compose exec -T backend python manage.py create_default_categories --skip-existing || echo "⚠️  Categories may already exist"

# Step 15: Check status
echo ""
echo "✅ Setup Complete!"
echo ""
echo "Container Status:"
docker-compose ps
echo ""
echo "Next Steps:"
echo "1. Edit /opt/lifepilot/.env with production values"
echo "2. Restart containers: cd /opt/lifepilot && docker-compose restart"
echo "3. Check logs: docker-compose logs -f backend"
echo "4. Add GitHub Secrets to your repository"
echo "5. Trigger deployment via GitHub Actions"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose stop"
echo "  Status: docker-compose ps"
echo ""
echo "Documentation: https://github.com/Faxriddin1/productflow/blob/main/.github/GCP_DEPLOYMENT_GUIDE.md"
