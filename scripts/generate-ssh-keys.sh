#!/bin/bash

# 🔑 SSH Key Generator for GitHub Actions Deployment
# Run this script on your local machine

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
KEY_NAME="github_actions_workspace_frontend"
EMAIL="github-actions@workspace-frontend.com"
SSH_DIR="$HOME/.ssh"

echo -e "${BLUE}🔑 SSH Key Generator for GitHub Actions Deployment${NC}"
echo "=================================================="

# Create SSH directory if not exists
mkdir -p $SSH_DIR
chmod 700 $SSH_DIR

# Generate SSH key pair
echo -e "${YELLOW}🔐 Generating SSH key pair...${NC}"
ssh-keygen -t ed25519 -C "$EMAIL" -f "$SSH_DIR/$KEY_NAME" -N ""

echo -e "${GREEN}✅ SSH keys generated successfully!${NC}"
echo ""

# Display public key
echo -e "${BLUE}📋 Public Key (add to production server):${NC}"
echo "================================================================"
cat "$SSH_DIR/$KEY_NAME.pub"
echo ""
echo "================================================================"
echo ""

# Display private key
echo -e "${BLUE}🔒 Private Key (add to GitHub Secrets):${NC}"
echo "================================================================"
cat "$SSH_DIR/$KEY_NAME"
echo ""
echo "================================================================"
echo ""

# Instructions
echo -e "${YELLOW}📝 Setup Instructions:${NC}"
echo ""
echo -e "${GREEN}1. Add Public Key to Production Server:${NC}"
echo "   SSH to your production server and run:"
echo -e "   ${BLUE}echo '$(cat "$SSH_DIR/$KEY_NAME.pub")' >> ~/.ssh/authorized_keys${NC}"
echo -e "   ${BLUE}chmod 600 ~/.ssh/authorized_keys${NC}"
echo ""

echo -e "${GREEN}2. Add Secrets to GitHub Repository:${NC}"
echo "   Go to: https://github.com/Linh3694/workspace-frontend/settings/secrets/actions"
echo "   Add these secrets:"
echo ""
echo -e "   ${YELLOW}SSH_PRIVATE_KEY${NC}:"
echo "   Copy the entire private key above (including BEGIN/END lines)"
echo ""
echo -e "   ${YELLOW}SSH_HOST${NC}:"
echo "   Your production server IP or domain"
echo ""
echo -e "   ${YELLOW}SSH_USER${NC}:"
echo "   Your username on production server"
echo ""
echo -e "   ${YELLOW}SSH_PORT${NC}:"
echo "   SSH port (usually 22)"
echo ""

echo -e "${GREEN}3. Test SSH Connection:${NC}"
echo "   Test from your local machine:"
echo -e "   ${BLUE}ssh -i $SSH_DIR/$KEY_NAME user@your-production-server${NC}"
echo ""

echo -e "${GREEN}4. Optional: Add to SSH Config${NC}"
echo "   Add this to ~/.ssh/config for easier access:"
echo ""
echo -e "${BLUE}Host workspace-prod${NC}"
echo -e "${BLUE}    HostName your-production-server${NC}"
echo -e "${BLUE}    User your-username${NC}"
echo -e "${BLUE}    IdentityFile $SSH_DIR/$KEY_NAME${NC}"
echo -e "${BLUE}    IdentitiesOnly yes${NC}"
echo ""
echo "   Then you can SSH with: ${BLUE}ssh workspace-prod${NC}"
echo ""

# Security reminder
echo -e "${RED}🔒 Security Reminder:${NC}"
echo "• Keep your private key secure and never share it"
echo "• Only add the public key to authorized_keys"
echo "• Consider using SSH key passphrases for extra security"
echo "• Regularly rotate your SSH keys"
echo ""

echo -e "${GREEN}🎉 SSH keys are ready for deployment!${NC}"

# Save instructions to file
INSTRUCTIONS_FILE="ssh-setup-instructions.txt"
cat > $INSTRUCTIONS_FILE << EOF
SSH Setup Instructions for Workspace Frontend Deployment
========================================================

Generated on: $(date)

Public Key (add to production server ~/.ssh/authorized_keys):
================================================================
$(cat "$SSH_DIR/$KEY_NAME.pub")

Private Key (add to GitHub Secrets as SSH_PRIVATE_KEY):
================================================================
$(cat "$SSH_DIR/$KEY_NAME")

GitHub Secrets to add:
=====================
SSH_PRIVATE_KEY = [Private key above]
SSH_HOST = [Your production server IP/domain]
SSH_USER = [Your production server username]
SSH_PORT = 22

Test Command:
=============
ssh -i $SSH_DIR/$KEY_NAME user@your-production-server

SSH Config Entry (optional):
============================
Host workspace-prod
    HostName your-production-server
    User your-username
    IdentityFile $SSH_DIR/$KEY_NAME
    IdentitiesOnly yes
EOF

echo -e "${BLUE}💾 Instructions saved to: $INSTRUCTIONS_FILE${NC}" 