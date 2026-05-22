export type GameConfig = {
  slug: string;
  name: string;
  split: [string, string];
  emoji: string;
  description: string;
  players: string;
  themeColor: string;
  steps: string[];
};

export const GAMES: GameConfig[] = [
  {
    slug: "wordspy",
    name: "Wordspy",
    split: ["Word", "spy"],
    emoji: "🕵️",
    description: "Find the spy before they fool everyone.",
    players: "4–10",
    themeColor: "#CC785C",
    steps: [
      "Everyone secretly gets a word — 1 Undercover gets a similar but different word, 1 Mr. Phantom gets nothing",
      "Go around: each player gives one one-word clue hinting at their word without saying it",
      "Discuss who seems suspicious — too vague? Too confident? Something feels off?",
      "Vote to eliminate the player you think is the Undercover or Mr. Phantom",
      "Civilians win by eliminating all threats — Undercover wins by outnumbering Civilians — Mr. Phantom wins by guessing the secret word after being eliminated",
    ],
  },
  {
    slug: "mafia",
    name: "Mafia",
    split: ["Ma", "fia"],
    emoji: "🔪",
    description: "Vote out the Mafia before they take over.",
    players: "5–15",
    themeColor: "#1A1A1A",
    steps: [
      "Roles are secretly assigned — some are Mafia, others are Village (Villager, Doctor, Police), one is the God (moderator)",
      "Night: everyone closes eyes, Mafia silently picks a target — Doctor protects one player, Police investigates one",
      "God announces who was eliminated (not their role) — village debates who might be Mafia",
      "Village votes to eliminate a suspect — God records the result",
      "Village wins by eliminating all Mafia — Mafia wins by equalling or outnumbering the Village",
    ],
  },
  {
    slug: "dumbcharades",
    name: "DumbCharades",
    split: ["Dumb", " Charades"],
    emoji: "🎬",
    description: "Mime it, flail it, crack up everyone.",
    players: "4+",
    themeColor: "#CC785C",
    steps: [
      "Split into teams — each round one player is the actor",
      "Actor privately picks Easy (1 pt), Medium (1–3 pts), or Hard (2–5 pts)",
      "Act it out with no talking, no sounds, no mouthing words",
      "Teammates shout guesses freely — hit Correct the moment someone gets it",
      "Points are based on difficulty and how fast you guessed — highest score wins",
    ],
  },
  {
    slug: "pictionary",
    name: "Pictionary",
    split: ["Pic", "tionary"],
    emoji: "🎨",
    description: "Draw a word, watch them lose their minds.",
    players: "4+",
    themeColor: "#CC785C",
    steps: [
      "Split into teams — each round one player is the drawer",
      "Drawer privately picks Easy (1 pt), Medium (1–3 pts), or Hard (2–5 pts)",
      "Draw it — no letters, numbers, talking, or gesturing",
      "Teammates shout guesses freely — hit Correct the moment someone gets it",
      "Points are based on difficulty and how fast you guessed — highest score wins",
    ],
  },
  {
    slug: "wavelength",
    name: "Wavelength",
    split: ["Wave", "length"],
    emoji: "〰️",
    description: "Two teams. One spectrum. Find the wavelength.",
    players: "4–12",
    themeColor: "#4A90D9",
    steps: [
      "Two teams compete — each round one player is the Psychic",
      "Psychic alone sees the spectrum card (e.g. Cold ↔ Hot) and a hidden target on it",
      "Psychic gives one-word clue — their team drags the needle to their best guess",
      "Opposing team bets left or right of the needle for a +1 bonus point",
      "Needle revealed: Bullseye = 4 pts, Close = 3, Almost = 2, Miss = 0 — first team to target score wins",
    ],
  },
];

export const GAME_BY_SLUG = Object.fromEntries(GAMES.map((g) => [g.slug, g])) as Record<string, GameConfig>;
