#!/bin/bash
# Clawd Face - Automated Setup Script
# Run this on your Clawdbot server

set -e

echo "🤖 Clawd Face Installer"
echo "========================"
echo ""

# Config
INSTALL_DIR="${CLAWD_FACE_DIR:-$HOME/clawd-face}"
PORT="${CLAWD_FACE_PORT:-3333}"
CLAWDBOT_HOME="${CLAWDBOT_HOME:-$HOME/.clawdbot}"
SESSIONS_FILE="$CLAWDBOT_HOME/agents/main/sessions/sessions.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() { echo -e "${GREEN}▶${NC} $1"; }
print_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✖${NC} $1"; }

# Check requirements
print_step "Checking requirements..."

if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Install it first: https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
fi

if [ ! -f "$SESSIONS_FILE" ]; then
    print_warn "Clawdbot sessions file not found at $SESSIONS_FILE"
    print_warn "Make sure Clawdbot is installed and has run at least once"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
    print_step "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull
else
    print_step "Cloning repository..."
    git clone https://github.com/martinbon39/clawd-face-react.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
print_step "Installing dependencies..."
npm install

# Build
print_step "Building React app..."
npm run build

# Configure watcher
print_step "Configuring watcher..."
WATCHER_DIR="$INSTALL_DIR/watcher"
STATE_FILE="$WATCHER_DIR/state.json"

# Create initial state
echo '{"state":"idle","activity":"","updated":"'$(date -Iseconds)'"}' > "$STATE_FILE"

# Check for pm2
if command -v pm2 &> /dev/null; then
    print_step "Setting up pm2 processes..."
    
    # Stop existing if any
    pm2 delete clawd-face-watcher 2>/dev/null || true
    pm2 delete clawd-face-server 2>/dev/null || true
    
    # Start watcher
    cd "$WATCHER_DIR"
    SESSIONS_FILE="$SESSIONS_FILE" STATE_FILE="$STATE_FILE" pm2 start watcher.js --name clawd-face-watcher
    
    # Start server  
    REACT_DIR="$INSTALL_DIR/dist" STATE_FILE="$STATE_FILE" PORT="$PORT" pm2 start server.js --name clawd-face-server
    
    pm2 save
    
    echo ""
    print_step "pm2 processes started!"
    pm2 list | grep clawd-face
else
    print_warn "pm2 not found. Install it for production: npm install -g pm2"
    echo ""
    echo "To run manually:"
    echo "  cd $WATCHER_DIR"
    echo "  SESSIONS_FILE=$SESSIONS_FILE node watcher.js &"
    echo "  REACT_DIR=$INSTALL_DIR/dist PORT=$PORT node server.js &"
fi

echo ""
echo "========================================"
print_step "Installation complete!"
echo "========================================"
echo ""
echo "📍 Local URL: http://localhost:$PORT"
echo ""
echo "🌐 To expose on internet, setup Cloudflare Tunnel:"
echo "   1. cloudflared tunnel create clawd-face"
echo "   2. Configure tunnel to point to localhost:$PORT"
echo "   3. cloudflared tunnel run clawd-face"
echo ""
echo "🔐 Recommended: Add Cloudflare Access for authentication"
echo "   Dashboard: https://one.dash.cloudflare.com"
echo ""
