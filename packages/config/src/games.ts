export type GameConfig = {
  slug: string;
  name: string;
  split: [string, string];
  emoji: string;
  description: string;
  players: string;
  themeColor: string;
  steps: string[];
  tags: string[];
  featured?: boolean;
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
    tags: ["deduction", "small"],
    featured: true,
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
    themeColor: "#CC785C",
    tags: ["deduction", "teams"],
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
    tags: ["acting", "teams", "small"],
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
    tags: ["drawing", "teams", "small"],
    steps: [
      "Split into teams — each round one player is the drawer",
      "Drawer privately picks Easy (1 pt), Medium (1–3 pts), or Hard (2–5 pts)",
      "Draw it — no letters, numbers, talking, or gesturing",
      "Teammates shout guesses freely — hit Correct the moment someone gets it",
      "Points are based on difficulty and how fast you guessed — highest score wins",
    ],
  },
  {
    slug: "mindfield",
    name: "Mind Field",
    split: ["Mind", " Field"],
    emoji: "🧠",
    description: "Spymasters hint. Agents guess. Don't hit the bomb.",
    players: "4–16",
    themeColor: "#CC785C",
    tags: ["deduction", "teams", "online"],
    featured: false,
    steps: [
      "Two teams — Red (9 words) and Blue (8 words) — compete on a shared 5×5 grid",
      "Each team has one Spymaster who sees the full colour-coded grid on their own device",
      "Spymaster gives a one-word clue + a number hinting at multiple words — e.g. 'River, 3'",
      "Field Agents tap words they think match the clue — wrong colour ends your turn",
      "One word is the Bomb — tap it and your team instantly loses the round. First to targetWins rounds wins",
    ],
  },
  {
    slug: "wavelength",
    name: "Wavelength",
    split: ["Wave", "length"],
    emoji: "〰️",
    description: "Two teams. One spectrum. Find the wavelength.",
    players: "4–12",
    themeColor: "#CC785C",
    tags: ["teams"],
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
