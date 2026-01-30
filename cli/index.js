#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const log = (icon, msg) => console.log(`${icon}  ${msg}`);
const success = (msg) => log('✅', `${c.green}${msg}${c.reset}`);
const info = (msg) => log('📍', `${c.cyan}${msg}${c.reset}`);
const warn = (msg) => log('⚠️', `${c.yellow}${msg}${c.reset}`);
const error = (msg) => log('❌', `${c.yellow}${msg}${c.reset}`);

// Config
const PORT = process.env.PORT || 3333;
const HOME = process.env.HOME || process.env.USERPROFILE;
const CLAWDBOT_PATHS = [
  path.join(HOME, '.clawdbot/agents/main/sessions/sessions.json'),
  '/root/.clawdbot/agents/main/sessions/sessions.json',
];

console.log('');
console.log(`${c.bold}${c.magenta}🤖 Clawd Face${c.reset}`);
console.log(`${c.dim}Real-time animated face for your AI assistant${c.reset}`);
console.log('');

// Find Clawdbot sessions
let sessionsFile = process.env.SESSIONS_FILE;
if (!sessionsFile) {
  for (const p of CLAWDBOT_PATHS) {
    if (fs.existsSync(p)) {
      sessionsFile = p;
      break;
    }
  }
}

if (!sessionsFile || !fs.existsSync(sessionsFile)) {
  error('Clawdbot sessions not found!');
  console.log('');
  console.log(`  Expected at: ${c.dim}~/.clawdbot/agents/main/sessions/sessions.json${c.reset}`);
  console.log('');
  console.log(`  Make sure Clawdbot is installed and has run at least once.`);
  console.log(`  Or set: ${c.cyan}SESSIONS_FILE=/path/to/sessions.json npx clawd-face${c.reset}`);
  console.log('');
  process.exit(1);
}

success(`Found Clawdbot at ${c.dim}${path.dirname(path.dirname(path.dirname(sessionsFile)))}${c.reset}`);

// Paths
const ROOT = path.join(__dirname, '..');
const WATCHER_DIR = path.join(ROOT, 'watcher');
const DIST_DIR = path.join(ROOT, 'dist');
const STATE_FILE = path.join(WATCHER_DIR, 'state.json');

// Initialize state file
fs.writeFileSync(STATE_FILE, JSON.stringify({ state: 'idle', activity: '', updated: new Date().toISOString() }));

// Check if dist exists, if not build
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  info('Building React app...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    success('Build complete');
  } catch (e) {
    error('Build failed. Run npm install first.');
    process.exit(1);
  }
}

// Start watcher
info('Starting watcher...');
const watcher = spawn('node', ['watcher.js'], {
  cwd: WATCHER_DIR,
  env: { ...process.env, SESSIONS_FILE: sessionsFile, STATE_FILE },
  stdio: ['ignore', 'pipe', 'pipe'],
});

watcher.stdout.on('data', (d) => {
  const line = d.toString().trim();
  if (line && !line.includes('────')) {
    process.stdout.write(`${c.dim}[watcher] ${line}${c.reset}\n`);
  }
});

// Start server
info('Starting server...');
const server = spawn('node', ['server.js'], {
  cwd: WATCHER_DIR,
  env: { ...process.env, PORT, REACT_DIR: DIST_DIR, STATE_FILE },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (d) => {
  const line = d.toString().trim();
  if (line) process.stdout.write(`${c.dim}[server] ${line}${c.reset}\n`);
});

// Wait for server to be ready
const waitForServer = () => new Promise((resolve) => {
  const check = () => {
    http.get(`http://localhost:${PORT}`, (res) => {
      if (res.statusCode === 200) resolve();
      else setTimeout(check, 200);
    }).on('error', () => setTimeout(check, 200));
  };
  setTimeout(check, 500);
});

// Start tunnel
const startTunnel = async () => {
  await waitForServer();
  success(`Local server running at ${c.cyan}http://localhost:${PORT}${c.reset}`);
  
  console.log('');
  info('Creating public tunnel...');
  
  // Try localtunnel
  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port: PORT });
    
    console.log('');
    console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}`);
    console.log('');
    console.log(`  ${c.bold}${c.green}🎉 Clawd Face is live!${c.reset}`);
    console.log('');
    console.log(`  ${c.bold}Public URL:${c.reset}  ${c.cyan}${c.bold}${tunnel.url}${c.reset}`);
    console.log(`  ${c.bold}Local URL:${c.reset}   ${c.dim}http://localhost:${PORT}${c.reset}`);
    console.log('');
    console.log(`  ${c.dim}Open the URL in a browser and put it on a second screen!${c.reset}`);
    console.log(`  ${c.dim}Press Ctrl+C to stop.${c.reset}`);
    console.log('');
    console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}`);
    console.log('');
    
    tunnel.on('close', () => {
      warn('Tunnel closed');
      cleanup();
    });
    
  } catch (e) {
    // Fallback: no tunnel, local only
    console.log('');
    console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}`);
    console.log('');
    console.log(`  ${c.bold}${c.green}🎉 Clawd Face is running!${c.reset}`);
    console.log('');
    console.log(`  ${c.bold}Local URL:${c.reset}  ${c.cyan}${c.bold}http://localhost:${PORT}${c.reset}`);
    console.log('');
    console.log(`  ${c.dim}For public access, install localtunnel:${c.reset}`);
    console.log(`  ${c.cyan}npm install -g localtunnel && lt --port ${PORT}${c.reset}`);
    console.log('');
    console.log(`  ${c.dim}Press Ctrl+C to stop.${c.reset}`);
    console.log('');
    console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}`);
    console.log('');
  }
};

// Cleanup
const cleanup = () => {
  console.log('');
  info('Shutting down...');
  watcher.kill();
  server.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Go!
startTunnel();
