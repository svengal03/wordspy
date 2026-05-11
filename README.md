# 🕵️ Wordspy — India Edition

> A social deduction word game for 3–10 players, inspired by Undercover. Built with Next.js 15, Pusher Realtime, and deployed on Vercel.

---

## 🎮 What is Wordspy?

Wordspy is a party game where players receive secret words and must give clever clues to prove they know their word — without revealing it to the Ghost (who has no word at all). An Undercover player has a *similar* word and must blend in with the Civilians.

**Roles:**
- 🎭 **Civilian** — gets the main secret word. Find allies, expose infiltrators.
- 🕵️ **Undercover** — gets a similar but different word. Blend in. Survive.
- 👻 **Ghost** — gets no word. Improvise. Guess the Civilian word if eliminated.

---

## 🇮🇳 Word Packs

| Pack | Description |
|---|---|
| 🎬 Bollywood | Hindi cinema 2000–2025 |
| 🎭 Tollywood | Telugu & Tamil cinema 2000–2025 |
| 🍛 South Indian Food | Classic dishes from South India |
| 🫓 North Indian Food | Flavours from the North |
| 🥘 Street Food | India's best street eats |
| 🏏 Cricket | India's religion |
| 🏙️ Indian Cities | From metros to hidden gems |
| 🪔 Festivals | Celebrations across India |
| 📺 Web Series | OTT hits from India |
| 🌟 Bollywood Actors | Stars of Hindi cinema |

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Realtime | Pusher (room sync, chat, voting) |
| State | Zustand |
| Animations | Framer Motion |
| Fonts | DM Sans (Google Fonts) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/yourusername/wordspy.git
cd wordspy
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Pusher credentials:
```
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
PUSHER_APP_ID=your_pusher_app_id_here
PUSHER_SECRET=your_pusher_secret_here
```

Get your Pusher credentials:
1. Go to [pusher.com](https://pusher.com)
2. Sign up / Log in
3. Create an App → Keys → Copy your Key, Cluster, App ID, and Secret

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow prompts. When asked for environment variables, add `ABLY_API_KEY`.

### Option B — Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add Environment Variables:
   - `NEXT_PUBLIC_PUSHER_KEY`
   - `NEXT_PUBLIC_PUSHER_CLUSTER`
   - `PUSHER_APP_ID`
   - `PUSHER_SECRET`
4. Deploy ✅

---

## 📁 Project Structure

```
wordspy/
├── app/
│   ├── page.tsx              # Home screen
│   ├── layout.tsx            # Root layout + fonts
│   ├── globals.css           # CSS reset
│   ├── offline/
│   │   └── page.tsx          # Offline pass-phone game
│   ├── room/
│   │   └── [id]/
│   │       └── page.tsx      # Online room (Ably-powered)
│   └── api/
│       ├── pusher-event/     # Pusher event broadcast endpoint
│       └── rooms/            # Room create/get/update
├── components/
│   ├── ui/
│   │   └── index.tsx         # Design system primitives
│   └── game/
│       ├── LobbySetup.tsx    # Lobby + config
│       ├── RoleReveal.tsx    # Pass-phone word reveal
│       ├── CluePhase.tsx     # Clue giving phase
│       ├── VotePhase.tsx     # Voting phase
│       ├── EliminationScreen.tsx # Elimination + ghost guess
│       ├── SummaryScreen.tsx # End of game summary
│       └── ChatPanel.tsx     # Online chat with emojis
├── lib/
│   ├── types.ts              # All TypeScript interfaces
│   ├── gameEngine.ts         # Core game logic (pure functions)
│   ├── wordPacks.ts          # All 10 India word packs
│   ├── store.ts              # Zustand global state
│   └── usePusher.ts          # Pusher realtime hook
└── docs/
    ├── ARCHITECTURE.md       # System design
    ├── DESIGN.md             # UI/UX design system
    ├── GAMEPLAY.md           # Full game rules
    └── DEPLOY.md             # Deployment guide
```

---

## 🎲 Game Modes

### Online Mode
- Host creates a room → gets a 6-character code
- Friends join with the code from any device
- Real-time sync via Ably (chat, votes, game state)
- Works across different networks

### Offline Mode
- One phone, everyone in the same room
- Pass phone to each player for private word reveal
- No internet required after page loads

---

## 🔮 Future: Claude AI Word Generator

The codebase is ready for Claude API integration. When you're ready:

1. Add `ANTHROPIC_API_KEY` to `.env.local`
2. Uncomment the word generator in `app/api/generate-words/route.ts`
3. The host can type any theme (e.g. "Hyderabad street food") and Claude generates fresh word pairs

---

## 📄 License

MIT — build on it, fork it, enjoy it!
