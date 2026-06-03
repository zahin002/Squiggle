# 🎨 Squiggle

A real-time multiplayer drawing and guessing game built with React, Node.js, Socket.IO, and WebRTC.

---

## Features

- 🖌️ **Live drawing canvas** with brushes, shapes, eraser, fill tool, and undo/redo
- 💬 **Real-time chat & guessing** powered by Socket.IO
- 🎙️ **Peer-to-peer voice chat** via WebRTC
- ⚡ **Power-up system** — Hint Steal, Extra Clues, Freeze Time
- 💰 **Reward economy** — Gold Coins, Diamonds, win streaks, daily login bonuses
- 🎭 **Spectator mode** with read-only access
- 🗂️ **10 genre categories** + custom word lists
- 🧑‍🎨 **Avatar customization** and room configuration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Socket.IO Client, WebRTC |
| Backend | Node.js, Express.js, Socket.IO Server |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO (game sync), WebRTC (voice) |
| Styling | CSS3 |

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/squiggle.git
cd squiggle
```

**2. Install all dependencies**
```bash
npm run install:all
```

**3. Set up environment variables**
```bash
cp .env.example server/.env
# Then open server/.env and fill in your values
```

For AI-powered word generation, create a Google Gemini API key and set:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**4. Run in development mode**
```bash
npm run dev
```

This starts both the client (http://localhost:3000) and server (http://localhost:5000) concurrently.

---

## Project Structure

```
squiggle/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Canvas, chat, game, lobby, powerups, UI
│       ├── pages/          # Route-level views
│       ├── hooks/          # useSocket, useWebRTC, useCanvas
│       ├── context/        # Auth, game, currency state
│       └── utils/          # Helper functions
├── server/                 # Node.js backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express API routes
│   ├── socket/             # Socket.IO event handlers
│   └── middleware/         # Auth & validation
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Game Modes

| Mode | Power-ups | Rewards |
|------|-----------|---------|
| Standard | ✅ Enabled | ✅ Full |
| Selected Genre | ❌ Disabled | ✅ Full |
| Custom Words | ❌ Disabled | ✅ Full |

---

## Power-Up Costs

### Hint Steal
| Letters Remaining | Gold Coins | Diamonds |
|-------------------|-----------|----------|
| 3+ | 100 | 1 |
| 2 | 200 | 1 |
| 1 | 300 | 2 |

### Extra Clues (option elimination)
| Action | Cost (Gold) |
|--------|------------|
| Initial clue (5 options) | 150 |
| Reduce to 4 | +200 |
| Reduce to 3 | +300 |
| Reduce to 2 | +400 |
| Reduce to 1 | +500 |

### Freeze Time
- Initial freeze: 200 Gold Coins
- Each additional +20s: cost doubles (400 → 800 → ...)

---

## Reward System

- ✅ Correct guess: **+1 Gold Coin**
- 🖌️ Successful drawing: **+2 Gold Coins**
- ❌ Failed round: **-1 Gold Coin**
- 🏆 Game win: **+20 Gold Coins**
- 📅 Daily login: **+2 Gold Coins**
- 🚫 Vote-kick penalty: **-50 Gold Coins**

New users start with **5 Diamonds**. Additional diamonds are earned through win streaks.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.
