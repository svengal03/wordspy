# 🔫 Mafia — Game Document

## Overview

Mafia is a **social deduction role-playing game** for 5–15 players. A secret Mafia faction is hidden among the Villagers. Each night, the Mafia silently eliminates someone. Each day, the group debates and votes to execute a suspect. Special roles (Doctor, Police) give the town extra tools to fight back. One player acts as **God** (narrator/host) — they know all roles and run the game.

Offline pass-the-phone only — no online/multiplayer mode.

---

## Objective

| Side | Win By |
|---|---|
| 🏘️ Villagers | Eliminating all Mafia members |
| 👹 Mafia | Reaching parity — Mafia count equals or exceeds non-Mafia living players |

---

## Roles

### ⚖️ God (Host)
- Knows **all roles** before the game begins
- Narrates the game: wakes players up, announces results, runs the vote
- **Never eliminated** — stays active until the game ends
- Added first via the host name input; always the first player in the list

### 👹 Mafia
- 1–3 players depending on group size (floor(playerCount / 4), minimum 1)
- Know each other's identities at role reveal
- Each night: silently agree on a target and indicate to God
- During the day: must pretend to be Villagers, deflect suspicion

### 🏘️ Villager
- No special power — relies on observation, logic, and social pressure
- The majority of the group
- During the day: accuse, defend, form coalitions

### 🏥 Doctor (optional)
- Each night: chooses one player to save (God marks as protected)
- If the Mafia targets the same player → no one dies that night
- Cannot save the same player on consecutive nights (`doctorLastTarget` enforced)
- Can save themselves (configurable via `doctorCanSelfSave`)

### 🚔 Police (optional)
- Each night: investigates one player
- God silently signals: thumbs up (Mafia) or thumbs down (not Mafia)
- The Police player sees the result, no one else does
- **Strategy:** Reveal yourself strategically — once known, you become a target

---

## Role Assignment

```
assignRoles(players, config):
  1. God role assigned to host (first player)
  2. playingCount = players.length - 1  (excludes God)
  3. mafiaCount = Math.max(1, Math.floor(playingCount / 4))
  4. Add police (if enabled), doctor (if enabled), fill rest with villagers
  5. Fisher-Yates shuffle → assign to players
```

**Mafia count by group size:**

| Non-God Players | Mafia |
|---|---|
| 4–7 | 1 |
| 8–11 | 2 |
| 12–15 | 3 |

**Recommended minimums:**
- No special roles: 5 players
- With Doctor + Police: 7 players

---

## Game Phases

```
setup → role-reveal → night → day → vote → (night again or game-over)
```

### `setup`
- Host enters their name → confirmed as God
- Host adds all other players by name (max 15)
- Host configures options (Doctor, Police, timers)
- Host taps **Start** → `assignRoles()` runs

### `role-reveal`
- Phone passed around face-down
- Each player taps to see their role privately
- Mafia players also see their teammates' names
- `revealIndex` increments until all players have seen their role
- God sees all roles (already knew them)

### `night`
Night has sub-phases, controlled by God tapping through them:

| Sub-phase | Who acts | What happens |
|---|---|---|
| `sleeping` | Everyone | All players close eyes |
| `mafia-wake` | Mafia | Open eyes, silently pick a target, God notes it |
| `doctor-wake` | Doctor | Opens eyes, silently picks someone to save, God notes it |
| `police-wake` | Police | Opens eyes, silently points at a player, God signals Mafia/not |
| `resolving` | God only | God taps to resolve night → `resolveNight()` runs |

`resolveNight()` logic:
- If Doctor's target === Mafia's target → `savedByDoctor = true`, no elimination
- Otherwise → Mafia's target is eliminated
- Doctor cannot save the same player twice in a row (`doctorLastTarget`)

### `day`
- God announces the night result (who was killed, or "no one")
- Open discussion — optional discussion timer
- Players debate, accuse, defend
- God nominates one player (or facilitates group nomination) for the vote

### `vote`
- God presents the nominated player
- All living non-God players vote: **raise hand for Yes** (eliminate) or keep down for No
- Host taps `+` to tally `voteYes` / `voteNo`
- Optional voting timer
- Majority Yes → eliminated, role revealed → check win condition
- Majority No / tie → player is spared, return to next night

### `game-over`
- Displays winner (Mafia or Villagers)
- Shows all roles and elimination history
- Option to play again

---

## Special Flows

### Night Resolution

```ts
resolveNight(state) → NightResult:
  policeResult = if policeEnabled && policeTarget:
    { targetName, isMafia: target.role === "mafia" }
  
  if no mafiaTarget → nobody killed
  if doctorEnabled && mafiaTarget === doctorTarget → savedByDoctor = true, nobody killed
  otherwise → target is killed (killedId, killedName, killedRole)
```

Doctor constraint: `doctorLastTarget` stores the previous night's save target. Doctor cannot repeat it.

---

## Win Condition

```ts
checkWin(players):
  living = getPlaying(players)  // excludes God, excludes eliminated
  mafiaCount = living where role === "mafia"
  others = living where role !== "mafia"
  
  if mafiaCount === 0 → "villager"
  if mafiaCount >= others → "mafia"
  otherwise → null
```

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `doctorEnabled` | boolean | `true` | Include a Doctor role |
| `policeEnabled` | boolean | `true` | Include a Police role |
| `doctorCanSelfSave` | boolean | `true` | Doctor may choose themselves as save target |
| `votingTimerEnabled` | boolean | `false` | Enable countdown timer for vote phase |
| `votingTimerSeconds` | number | `60` | Duration of voting timer |
| `discussionTimerSeconds` | number | `180` | Duration of day discussion timer |

---

## Implemented Screens / Components

| Component | Phase | File |
|---|---|---|
| `SetupScreen` (inline) | setup | `app/page.tsx` |
| `RoleReveal` | role-reveal | `components/game/RoleReveal.tsx` |
| `NightScreen` | night | `components/game/NightScreen.tsx` |
| `DayScreen` | day | `components/game/DayScreen.tsx` |
| `VoteScreen` | vote | `components/game/VoteScreen.tsx` |
| `GameOverScreen` | game-over | `components/game/GameOverScreen.tsx` |
| `SpectatorView` | any (God view) | `components/game/SpectatorView.tsx` |
| `RulesModal` | any | `components/game/RulesModal.tsx` |

---

## State Shape Reference

```ts
// lib/types.ts
type MafiaRole = "mafia" | "villager" | "doctor" | "police" | "god"
type GamePhase = "setup" | "role-reveal" | "night" | "day" | "vote" | "game-over"
type NightSubPhase = "sleeping" | "mafia-wake" | "doctor-wake" | "police-wake" | "resolving"

interface Player {
  id: string
  name: string
  role: MafiaRole | null
  isEliminated: boolean
  hasSeenRole: boolean
}

interface GameConfig {
  doctorEnabled: boolean
  policeEnabled: boolean
  doctorCanSelfSave: boolean
  votingTimerEnabled: boolean
  votingTimerSeconds: number
  discussionTimerSeconds: number
}

const DEFAULT_CONFIG: GameConfig = {
  doctorEnabled: true,
  policeEnabled: true,
  doctorCanSelfSave: true,
  votingTimerEnabled: false,
  votingTimerSeconds: 60,
  discussionTimerSeconds: 180,
}

interface NightActions {
  mafiaTarget: string | null
  doctorTarget: string | null
  policeTarget: string | null
  doctorLastTarget: string | null
}

interface NightResult {
  killedId: string | null
  killedName: string | null
  killedRole: MafiaRole | null
  savedByDoctor: boolean
  policeResult: { targetName: string; isMafia: boolean } | null
}

interface EliminationRecord {
  round: number
  phase: "night" | "day"
  playerName: string
  role: MafiaRole
}

interface GameState {
  phase: GamePhase
  nightSubPhase: NightSubPhase
  round: number
  players: Player[]
  config: GameConfig
  nightActions: NightActions
  nominatedPlayerId: string | null
  voteYes: number
  voteNo: number
  lastNightResult: NightResult | null
  eliminationHistory: EliminationRecord[]
  winner: "mafia" | "villager" | null
  revealIndex: number
}
```

---

## Strategy Tips

**Mafia:**
- At night: coordinate fast, don't hesitate
- By day: be the loudest accuser — deflect suspicion onto Villagers
- Target the Police early if you can identify them

**Police:**
- Don't reveal yourself in round 1 — you'll get eliminated
- Use your information to guide discussion without giving yourself away
- If you know a Mafia member, build trust before revealing

**Doctor:**
- Protect the Police if you figure out who they are
- Vary your save targets — don't be predictable
- Consider protecting yourself if you suspect you're a target

**Villager:**
- Watch reactions when God announces night results — Mafia already knows the outcome
- Pay attention to who votes confidently for innocent players
- Trust the Police if they eventually reveal themselves
