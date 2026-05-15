# PlayHub

Turborepo monorepo hosting independent offline party-game apps. Each app is a standalone Next.js project. No accounts, no sign-up — pass the phone and play.

---

## Games

| App | Description | Players | Mode |
|---|---|---|---|
| 🕵️ **Wordspy** | Social deduction word game — find allies, expose infiltrators | 3–10 | Online + Offline |
| 🔫 **Mafia** | Hidden Mafia vs the town — night kills, day votes | 5–15 | Offline |
| 🎨 **Pictionary** | Draw it, guess it — team competition with difficulty tiers | 4+ | Offline |
| 🎬 **Dumb Charades** | Act it out silently — Bollywood and more | 4+ | Offline |

---

## Getting Started

### Install

```bash
npm install
```

### Run all apps

```bash
npm run dev
```

Apps start on separate ports:

| App | Port |
|---|---|
| home | 3000 |
| wordspy | 3001 |
| mafia | 3002 |
| pictionary | 3003 |
| dumbcharades | 3004 |

### Environment — Wordspy online mode only

Wordspy's online (multi-device) mode requires Pusher. Offline mode works without any env vars.

Create `apps/wordspy/.env.local`:

```
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
```

Get credentials at [pusher.com](https://pusher.com) — create an app, copy Key / Cluster / App ID / Secret.

Home app links — create `apps/home/.env.local`:

```
NEXT_PUBLIC_WORDSPY_URL=http://localhost:3001
NEXT_PUBLIC_MAFIA_URL=http://localhost:3002
NEXT_PUBLIC_PICTIONARY_URL=http://localhost:3003
NEXT_PUBLIC_DUMBCHARADES_URL=http://localhost:3004
```

---

## Structure

```
playhub/
├── apps/
│   ├── home/           ← Game hub — links to all apps
│   ├── wordspy/        ← Online + offline social deduction
│   ├── mafia/          ← Offline role-play
│   ├── pictionary/     ← Offline drawing game
│   └── dumbcharades/   ← Offline acting game
├── packages/
│   ├── core/           ← Word packs, difficulty constants, team palettes
│   └── ui/             ← Shared components: RevealCover, CategoryPicker, PlayerNameInput
├── docs/
│   ├── ARCHITECTURE.md ← App structure standards
│   ├── GAMEPLAY.md     ← All games overview + doc index
│   ├── NEW_GAME.md     ← End-to-end guide for adding a new game
│   └── gameplay/       ← Per-game design docs
│       ├── WORDSPY.md
│       ├── MAFIA.md
│       ├── PICTIONARY.md
│       └── DUMBCHARADES.md
└── AUDIT.md            ← Known duplication issues to fix
```

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Monorepo | Turborepo + npm workspaces |
| State | Zustand (Mafia, Wordspy) · useState (Pictionary, Dumb Charades) |
| Realtime | Pusher — Wordspy online mode only |
| Animations | Framer Motion |
| Font | DM Sans |
| Deployment | Vercel — each app deployed independently |

---

## Adding a New Game

Read `docs/NEW_GAME.md` for the full end-to-end flow. Short version:

1. Describe the game to Claude Code — rules, players, phases
2. Claude writes `docs/gameplay/{GAME}.md` — review and confirm it
3. Claude scaffolds the full app from `apps/mafia` and implements all files
4. Claude registers the game in `apps/home` and updates the docs

---

## Deploy

Each app deploys independently to Vercel. The home app reads game URLs from environment variables — set `NEXT_PUBLIC_{GAME}_URL` to each app's production URL.

Wordspy's online mode uses an in-memory room store. For multi-instance production deployments, replace with Redis (Upstash).

---

## License

MIT
