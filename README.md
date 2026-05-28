# 🃏 Midnight Mafia

A production-grade, real-time multiplayer Mafia party game built with React, TypeScript, Tailwind CSS, Framer Motion, Howler.js, Zustand, and Socket.io.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 18 + TypeScript               |
| Styling      | Tailwind CSS                        |
| Animation    | Framer Motion                       |
| Sound        | Howler.js                           |
| State        | Zustand (with localStorage persist) |
| Realtime     | Socket.io (client + server)         |
| Build tool   | Vite                                |
| Backend      | Node.js + Express + TypeScript      |
| PWA          | Web App Manifest                    |

---

## Features

- 🔴 **Online Multiplayer** — Real-time rooms with 4-letter join codes
- 🃏 **Playing Card Role Reveal** — Animated card flip per player with Sacramento script font
- ⚖️ **Voting System** — Live vote tally with progress bars, toggle votes
- 🎵 **Sound Design** — Ambient night loop, gunshot, card flip, win fanfares via Howler.js
- 📜 **Narrator Dashboard** — Full role visibility, phase controls, game log, timer
- 🏆 **Game History** — Last 20 games saved to localStorage
- 📸 **Shareable Result Card** — Download a PNG of the final scoreboard via html2canvas
- 📱 **PWA** — Installable on mobile, works like a native app
- 🔒 **TypeScript throughout** — Strict types on client and server

---

## Project Structure

```
midnight-mafia/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/screens/   # 6 full screens
│       ├── components/ui/        # Reusable UI pieces
│       ├── hooks/                # useSocket.ts
│       ├── store/                # Zustand gameStore
│       ├── sounds/               # Howler sound manager
│       ├── types/                # TypeScript types
│       └── utils/                # Role logic
└── server/          # Node.js + Socket.io backend
    └── src/
        ├── index.ts  # Full game server
        └── types.ts  # Server-side types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Install root + both workspaces
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Set up environment variables

Client (`client/.env`):
```
VITE_SERVER_URL=http://localhost:3001
```

Server (`server/.env`):
```
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Run in development

```bash
# From root — starts both client and server
npm run dev
```

Or run separately:
```bash
# Terminal 1 — server (port 3001)
cd server && npm run dev

# Terminal 2 — client (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173**

---

## How to Play

### Setup
1. One player opens the app and clicks **Create Room**
2. Share the 4-letter room code with other players
3. Everyone else clicks **Join Room** and enters the code
4. Host selects a Narrator and clicks **Deal the Roles**

### Role Reveal
- Each player takes the phone/device privately
- Taps the face-down card to reveal their role
- Passes the device to the next player

### Roles
| Role       | Team    | Night Action                          |
|------------|---------|---------------------------------------|
| Mafia      | Mafia   | Eliminate one villager                |
| Doctor     | Village | Protect one player                    |
| Detective  | Village | Investigate one player (nod/shake)    |
| Villager   | Village | Vote during the day                   |
| Narrator   | —       | Guides the game, sees all roles       |

### Game Flow
1. **Night** — Narrator guides Mafia → Doctor → Detective actions privately
2. **Day** — Everyone discusses and debates
3. **Vote** — Players vote to eliminate a suspect
4. Repeat until Mafia equals/outnumbers Village (Mafia wins) or all Mafia are eliminated (Village wins)

### Role Balancing
| Players | Mafia | Doctor | Detective | Villagers |
|---------|-------|--------|-----------|-----------|
| 5       | 1     | 1      | 1         | 1         |
| 6       | 1     | 1      | 1         | 2         |
| 8       | 1     | 1      | 1         | 4         |
| 9       | 2     | 1      | 1         | 4         |
| 12      | 2     | 1      | 1         | 7         |

---

## Deployment

### Deploy Server (Railway / Render / Fly.io)

```bash
cd server
npm run build
# Deploy dist/ folder — set PORT and CLIENT_URL env vars
```

### Deploy Client (Vercel / Netlify)

```bash
cd client
# Set VITE_SERVER_URL=https://your-server-url in .env.production
npm run build
# Deploy dist/ folder
```

---

## Scripts

| Command             | Description                     |
|---------------------|---------------------------------|
| `npm run dev`       | Start both client + server      |
| `npm run build`     | Build both for production       |
| `cd client && npm run dev`   | Client only (port 5173) |
| `cd server && npm run dev`   | Server only (port 3001) |

---

## License

MIT — build, fork, and ship freely.
