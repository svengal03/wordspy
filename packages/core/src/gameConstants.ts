export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#2BB34A",
  medium: "#F59E0B",
  hard: "#E84040",
};

export const TIMER_OPTIONS = [60, 90, 120] as const;

export const TEAM_PALETTE_PICTIONARY = ["#4A6CF7", "#E85D2F", "#2BB34A", "#9333EA", "#F59E0B", "#06B6D4"] as const;
export const TEAM_PALETTE_DUMBCHARADES = ["#E85D2F", "#4A6CF7", "#2BB34A", "#9333EA", "#F59E0B", "#06B6D4"] as const;
