#!/bin/bash
# Raspberry Pi Deployment Script
# This script downloads and deploys the latest release from GitHub
#
# Usage:
#   ./deploy-pi.sh              # Deploy latest release
#   ./deploy-pi.sh v1.2.0       # Deploy specific version
#
# Setup:
#   1. Clone this repo or copy this script to your Pi
#   2. Set GITHUB_REPO environment variable or edit below
#   3. chmod +x deploy-pi.sh
#   4. Run: ./deploy-pi.sh

set -e

# Configuration
GITHUB_REPO="${GITHUB_REPO:-owner/home-control}"  # Set your GitHub repo
INSTALL_DIR="${INSTALL_DIR:-/opt/home-control}"
SERVICE_NAME="home-control"
VERSION="${1:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check dependencies
command -v curl >/dev/null 2>&1 || error "curl is required"
command -v tar >/dev/null 2>&1 || error "tar is required"
command -v node >/dev/null 2>&1 || error "node is required"

# Get release URL
if [ "$VERSION" = "latest" ]; then
    log "Fetching latest release..."
    RELEASE_URL=$(curl -sL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" | \
        grep "browser_download_url.*tar.gz" | cut -d '"' -f 4)
    VERSION=$(curl -sL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" | \
        grep '"tag_name"' | cut -d '"' -f 4)
else
    log "Fetching release $VERSION..."
    RELEASE_URL="https://github.com/${GITHUB_REPO}/releases/download/${VERSION}/home-control-${VERSION}.tar.gz"
fi

[ -z "$RELEASE_URL" ] && error "Could not find release URL"
log "Downloading $VERSION from $RELEASE_URL"

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download and extract
curl -sL "$RELEASE_URL" -o "$TEMP_DIR/release.tar.gz"
mkdir -p "$TEMP_DIR/release"
tar -xzf "$TEMP_DIR/release.tar.gz" -C "$TEMP_DIR/release"

# Stop service if running
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log "Stopping $SERVICE_NAME service..."
    sudo systemctl stop "$SERVICE_NAME"
fi

# Backup current installation
if [ -d "$INSTALL_DIR" ]; then
    BACKUP_DIR="${INSTALL_DIR}.backup.$(date +%Y%m%d%H%M%S)"
    log "Backing up current installation to $BACKUP_DIR"
    sudo mv "$INSTALL_DIR" "$BACKUP_DIR"
fi

# Install new version
log "Installing to $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo cp -r "$TEMP_DIR/release/"* "$INSTALL_DIR/"

# Preserve config if exists
if [ -f "${BACKUP_DIR}/config.yaml" ]; then
    log "Restoring config.yaml from backup"
    sudo cp "${BACKUP_DIR}/config.yaml" "$INSTALL_DIR/"
elif [ ! -f "$INSTALL_DIR/config.yaml" ] && [ -f "$INSTALL_DIR/config.yaml.example" ]; then
    warn "No config.yaml found - copying example"
    sudo cp "$INSTALL_DIR/config.yaml.example" "$INSTALL_DIR/config.yaml"
fi

# Install dependencies
log "Installing npm dependencies..."
cd "$INSTALL_DIR"
sudo npm ci --production

# Start service
if systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    log "Starting $SERVICE_NAME service..."
    sudo systemctl start "$SERVICE_NAME"
    sudo systemctl status "$SERVICE_NAME" --no-pager
else
    warn "No systemd service found. Create one with: sudo nano /etc/systemd/system/${SERVICE_NAME}.service"
    echo ""
    echo "Example service file:"
    echo "---"
    cat << 'EOF'
[Unit]
Description=Home Control
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/home-control
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    echo "---"
fi

log "Deployment complete! Version: $VERSION"
