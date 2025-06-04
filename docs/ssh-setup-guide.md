# 🔐 SSH Setup Guide for Production Deployment

## Phương án 1: GitHub Actions SSH Deploy (Khuyến nghị)

### Bước 1: Tạo SSH Key trên máy local hoặc máy development

```bash
# Tạo SSH key pair
ssh-keygen -t ed25519 -C "github-actions@your-domain.com" -f ~/.ssh/github_actions_key

# Hoặc sử dụng RSA nếu server không support ed25519
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com" -f ~/.ssh/github_actions_key

# Xem public key
cat ~/.ssh/github_actions_key.pub

# Xem private key (để add vào GitHub Secrets)
cat ~/.ssh/github_actions_key
```

### Bước 2: Cấu hình trên máy chủ Production

```bash
# SSH vào máy chủ production
ssh user@your-production-server

# Tạo thư mục .ssh nếu chưa có
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Thêm public key vào authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions@your-domain.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Tạo thư mục cho project
sudo mkdir -p /var/www/workspace-frontend
sudo chown $USER:$USER /var/www/workspace-frontend
```

### Bước 3: Thêm Secrets vào GitHub Repository

Vào GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

```
SSH_PRIVATE_KEY = [Nội dung private key từ ~/.ssh/github_actions_key]
SSH_HOST = [IP hoặc domain của production server]
SSH_USER = [Username trên production server]
SSH_PORT = 22 (hoặc port SSH khác nếu có)
```

### Bước 4: Tạo Production Deploy Workflow

Tạo file `.github/workflows/deploy-production.yml`:

```yaml
name: 🚀 Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4
        
      - name: 🏗️ Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: 📦 Install dependencies
        run: npm ci
        
      - name: 🏗️ Build for production
        run: npm run build
        
      - name: 📦 Create deployment package
        run: |
          tar -czf deployment.tar.gz dist/
          
      - name: 🚀 Deploy to Production Server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            # Backup current version
            if [ -d "/var/www/workspace-frontend/current" ]; then
              sudo mv /var/www/workspace-frontend/current /var/www/workspace-frontend/backup-$(date +%Y%m%d_%H%M%S)
            fi
            
            # Create new directory
            sudo mkdir -p /var/www/workspace-frontend/current
            
      - name: 📤 Upload files to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          source: "deployment.tar.gz"
          target: "/tmp/"
          
      - name: 🔄 Extract and setup files
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            # Extract files
            cd /tmp
            tar -xzf deployment.tar.gz
            
            # Move to web directory
            sudo cp -r dist/* /var/www/workspace-frontend/current/
            sudo chown -R www-data:www-data /var/www/workspace-frontend/current
            sudo chmod -R 755 /var/www/workspace-frontend/current
            
            # Restart web server (nếu cần)
            sudo systemctl reload nginx
            
            # Cleanup
            rm -f /tmp/deployment.tar.gz
            rm -rf /tmp/dist
            
            echo "✅ Deployment completed successfully!"
```

## Phương án 2: Git Pull trên Production Server

### Bước 1: Tạo Deploy Key cho Repository

```bash
# Trên máy production, tạo SSH key
ssh-keygen -t ed25519 -C "production-server@your-domain.com" -f ~/.ssh/github_deploy_key

# Xem public key để add vào GitHub
cat ~/.ssh/github_deploy_key.pub
```

### Bước 2: Thêm Deploy Key vào GitHub
- Vào GitHub repository → Settings → Deploy keys → Add deploy key
- Paste public key và check "Allow write access"

### Bước 3: Cấu hình SSH trên Production Server

```bash
# Tạo SSH config
cat >> ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_key
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config

# Test SSH connection
ssh -T git@github.com
```

### Bước 4: Clone và setup trên Production

```bash
# Clone repository
cd /var/www
sudo git clone git@github.com:Linh3694/workspace-frontend.git
sudo chown -R $USER:$USER workspace-frontend
cd workspace-frontend

# Install Node.js và dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install
npm run build

# Setup Nginx (ví dụ)
sudo cp dist/* /var/www/html/workspace-frontend/
```

### Bước 5: Tạo Deploy Script

```bash
# Tạo script deploy
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build application  
npm run build

# Backup current version
if [ -d "/var/www/html/workspace-frontend.backup" ]; then
    sudo rm -rf /var/www/html/workspace-frontend.backup
fi

if [ -d "/var/www/html/workspace-frontend" ]; then
    sudo mv /var/www/html/workspace-frontend /var/www/html/workspace-frontend.backup
fi

# Deploy new version
sudo cp -r dist /var/www/html/workspace-frontend
sudo chown -R www-data:www-data /var/www/html/workspace-frontend
sudo chmod -R 755 /var/www/html/workspace-frontend

# Restart services if needed
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
EOF

chmod +x deploy.sh
```

## 🔧 Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html/workspace-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

Bạn muốn sử dụng phương án nào? Tôi sẽ tạo workflow cụ thể cho phương án bạn chọn. 