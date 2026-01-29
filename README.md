# 🤖 Clawd Face

A real-time animated face for your AI assistant. Watch Claude think, talk, browse, and code — like a Tamagotchi for your terminal.

![States Demo](https://img.shields.io/badge/states-15+-blue) ![React](https://img.shields.io/badge/react-18+-61dafb) ![License](https://img.shields.io/badge/license-MIT-green)

<p align="center">
  <img src="docs/states-preview.svg" alt="Clawd Face States" width="700">
</p>

## ✨ Features

- **15 emotional states** — idle, thinking, talking, working, curious, excited, confused, and more
- **Real-time sync** — 50ms polling for instant feedback
- **Smart activity detection** — shows what Claude is actually doing
- **Mouse tracking** — eyes follow your cursor in idle state
- **Easter eggs** — try typing "dance", "love", "matrix" or the Konami code ↑↑↓↓←→←→BA
- **Minimal design** — clean geometric shapes, bold colors

## 🎭 States

| State | Color | When |
|-------|-------|------|
| 😐 idle | Coral | Waiting for input |
| 🎧 listening | Light green | User is typing |
| 🤔 thinking | Blue | Claude is reasoning |
| 💬 talking | Green | Claude is responding |
| 💻 working | Dark green | Running commands |
| 🔍 curious | Purple | Reading files/searching |
| 🎯 focused | Navy | Browsing/editing code |
| ⚡ processing | Indigo | Waiting for tool results |
| 😊 happy | Yellow | Success! |
| 🤨 confused | Orange | Something unexpected |
| 😴 sleeping | Dark | Inactive |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A running [Clawdbot](https://github.com/clawdbot/clawdbot) instance

### Installation

```bash
# Clone the repo
git clone https://github.com/martinbon39/clawd-face-react.git
cd clawd-face-react

# Install dependencies
npm install

# Build
npm run build
```

### Running

You need 3 components:

#### 1. The Watcher (monitors Clawdbot activity)

```bash
# Copy the watcher to your Clawdbot directory
cp watcher/watcher.js /path/to/clawdbot/

# Edit SESSIONS_FILE path in watcher.js to match your setup
# Default: /root/.clawdbot/agents/main/sessions/sessions.json

# Run it
node watcher.js
```

#### 2. The Server (serves the face + state)

```bash
# Copy server.js and configure paths
cp watcher/server.js /path/to/clawdbot/

# Run it
node server.js
# → http://localhost:3333
```

#### 3. (Optional) Expose with Cloudflare Tunnel

```bash
# Create tunnel
cloudflared tunnel create clawd-face

# Configure (~/.cloudflared/config.yml)
tunnel: <your-tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: face.yourdomain.com
    service: http://localhost:3333
  - service: http_status:404

# Run tunnel
cloudflared tunnel run clawd-face
```

### PM2 (Production)

```bash
pm2 start watcher.js --name claude-face-watcher
pm2 start server.js --name claude-face-server
pm2 start "cloudflared tunnel run clawd-face" --name claude-face-tunnel
pm2 save
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  Your Server                                    │
│                                                 │
│  ┌──────────┐         ┌──────────────┐         │
│  │ Clawdbot │ writes  │ sessions/*.  │         │
│  │          │ ──────▶ │ jsonl        │         │
│  └──────────┘         └──────┬───────┘         │
│                              │ polls (50ms)    │
│                              ▼                 │
│                       ┌──────────────┐         │
│                       │  watcher.js  │         │
│                       └──────┬───────┘         │
│                              │ writes          │
│                              ▼                 │
│  ┌──────────┐         ┌──────────────┐         │
│  │ server.js│ ◀────── │  state.json  │         │
│  │ :3333    │ serves  └──────────────┘         │
│  └────┬─────┘                                  │
│       │                                         │
└───────┼─────────────────────────────────────────┘
        │
        ▼ (cloudflared tunnel)
   ┌─────────────┐
   │  Browser    │  React app polls state.json
   │  (you!)     │  every 50ms
   └─────────────┘
```

## 🎨 Customization

### Colors

Edit `src/components/ClawdFace/ClawdFace.module.css`:

```css
.idle { background: #E8927C; }      /* Coral */
.thinking { background: #7C9FE8; }  /* Blue */
.talking { background: #7CE8A3; }   /* Green */
/* ... */
```

### Face Shape

The face uses simple CSS shapes. Edit the `.eye` and `.mouth` classes:

```css
.eye {
  width: 45px;
  height: 45px;
  background: #1a1a1a;
  border-radius: 4px;  /* Square-ish */
}
```

### Add Custom States

1. Add state to `STATES` array in `ClawdFace.jsx`
2. Add CSS rules in `ClawdFace.module.css`
3. Add detection logic in `watcher.js`

## 🥚 Easter Eggs

| Trigger | Effect |
|---------|--------|
| Type `dance` | 🎵 Dancing animation |
| Type `love` | ❤️ Hearts particles |
| Type `hello` | 👋 Wave + smile |
| Type `matrix` | 💚 Matrix mode |
| Konami code | ⭐ Stars + dance |
| 3 clicks | Dance |
| 5 clicks | Dizzy eyes |
| 10 clicks | Rainbow mode |
| Press `?` | Show help panel |

## 📁 Project Structure

```
clawd-face-react/
├── src/
│   ├── components/
│   │   └── ClawdFace/
│   │       ├── ClawdFace.jsx      # Main face component
│   │       ├── ClawdFace.module.css
│   │       └── index.js
│   ├── hooks/
│   │   └── useEasterEggs.js       # Easter eggs logic
│   ├── App.jsx
│   └── App.css
├── watcher/
│   ├── watcher.js                 # Clawdbot activity monitor
│   └── server.js                  # Static server + state API
└── dist/                          # Production build
```

## 🤝 Contributing

PRs welcome! Ideas:
- [ ] WebSocket instead of polling
- [ ] Sound effects
- [ ] More easter eggs
- [ ] Theme presets
- [ ] Mobile app version

## 📄 License

MIT © [Martin Bonan](https://github.com/martinbon39)

---

<p align="center">
  Made with ❤️ for the Claude community
</p>
