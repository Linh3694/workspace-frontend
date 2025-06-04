#!/bin/bash

# 🚀 Production Server Setup Script for Workspace Frontend
# Run this script on your production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="workspace-frontend"
WEB_ROOT="/var/www/$PROJECT_NAME"
DOMAIN="your-domain.com"  # Change this to your domain

echo -e "${BLUE}🚀 Setting up production environment for $PROJECT_NAME${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
sudo apt install -y nginx curl wget git ufw

# Install Node.js 20
echo -e "${YELLOW}📦 Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo -e "${BLUE}🔍 Verifying installations...${NC}"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Nginx version: $(nginx -v 2>&1)"

# Create project directories
echo -e "${YELLOW}📁 Creating project directories...${NC}"
sudo mkdir -p $WEB_ROOT/{current,releases,backups,logs}
sudo chown -R $USER:www-data $WEB_ROOT
sudo chmod -R 755 $WEB_ROOT

# Setup Nginx configuration
echo -e "${YELLOW}🔧 Setting up Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $WEB_ROOT/current;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache CSS and JS
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Logging
    access_log $WEB_ROOT/logs/access.log;
    error_log $WEB_ROOT/logs/error.log;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${BLUE}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

# Setup firewall
echo -e "${YELLOW}🔒 Setting up firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Setup log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/$PROJECT_NAME > /dev/null <<EOF
$WEB_ROOT/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}
EOF

# Create a sample index.html
echo -e "${YELLOW}📄 Creating sample index.html...${NC}"
sudo mkdir -p $WEB_ROOT/current
sudo tee $WEB_ROOT/current/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Frontend - Coming Soon</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { margin: 0 0 1rem 0; font-size: 3rem; }
        p { margin: 0.5rem 0; opacity: 0.9; }
        .status { 
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #4CAF50;
            border-radius: 20px;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Workspace Frontend</h1>
        <p>Production server đã sẵn sàng!</p>
        <p>Đang chờ deployment từ GitHub Actions...</p>
        <div class="status">✅ Server Ready</div>
    </div>
</body>
</html>
EOF

sudo chown -R www-data:www-data $WEB_ROOT/current
sudo chmod -R 755 $WEB_ROOT/current

# Start and enable services
echo -e "${YELLOW}🚀 Starting services...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Display SSH public key for GitHub
echo -e "${BLUE}🔑 SSH Setup Instructions${NC}"
echo "================================================================"
echo -e "${YELLOW}1. Add these secrets to your GitHub repository:${NC}"
echo "   Repository → Settings → Secrets and variables → Actions"
echo ""
echo -e "${GREEN}SSH_HOST${NC}: $(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo -e "${GREEN}SSH_USER${NC}: $USER"
echo -e "${GREEN}SSH_PORT${NC}: 22"
echo ""
echo -e "${YELLOW}2. Generate SSH key for GitHub Actions:${NC}"
echo "Run this command on your local machine:"
echo -e "${GREEN}ssh-keygen -t ed25519 -C 'github-actions@$DOMAIN' -f ~/.ssh/github_actions_key${NC}"
echo ""
echo -e "${YELLOW}3. Add the public key to this server:${NC}"
echo "Copy the public key content to ~/.ssh/authorized_keys"
echo ""
echo -e "${YELLOW}4. Add the private key to GitHub Secrets as SSH_PRIVATE_KEY${NC}"
echo ""

# Show status
echo -e "${GREEN}✅ Production setup completed!${NC}"
echo "================================================================"
echo -e "${BLUE}📊 Setup Summary:${NC}"
echo "• Project directory: $WEB_ROOT"
echo "• Nginx config: /etc/nginx/sites-available/$PROJECT_NAME"
echo "• Domain: $DOMAIN (update in nginx config)"
echo "• Logs: $WEB_ROOT/logs/"
echo ""
echo -e "${BLUE}🌐 Next steps:${NC}"
echo "1. Update domain in nginx config: sudo nano /etc/nginx/sites-available/$PROJECT_NAME"
echo "2. Setup SSL with Let's Encrypt: sudo certbot --nginx -d $DOMAIN"
echo "3. Configure GitHub Secrets and run deployment"
echo ""
echo -e "${GREEN}🎉 Server is ready for deployment!${NC}"

# Test the setup
echo -e "${BLUE}🧪 Testing server setup...${NC}"
if curl -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ Web server is responding${NC}"
else
    echo -e "${RED}❌ Web server is not responding${NC}"
fi 