// Mafia role definitions
export const MAFIA_ROLE_META = {
  mafia:    { label: "Mafia",    emoji: "🔪", color: "#DC2626", bg: "#FEF2F2", team: "Mafia" },
  villager: { label: "Villager", emoji: "🏘️", color: "#16A34A", bg: "#F0FDF4", team: "Village" },
  doctor:   { label: "Doctor",   emoji: "💊", color: "#2563EB", bg: "#EFF6FF", team: "Village" },
  police:   { label: "Police",   emoji: "🚔", color: "#7C3AED", bg: "#F5F3FF", team: "Village" },
  god:      { label: "God",      emoji: "⚡", color: "#CA8A04", bg: "#FEF9C3", team: "Neutral" },
} as const;

// Wavelength team definitions
export const WAVELENGTH_TEAM_META = {
  A: { label: "Team A", color: "#CC785C", bg: "#FAECE7" },
  B: { label: "Team B", color: "#2563EB", bg: "#EFF6FF" },
} as const;

export const WAVELENGTH_ZONE_COLORS: Record<string, string> = {
  bullseye: "#CC785C",
  close:    "#D4956A",
  almost:   "#DCB280",
  miss:     "#AAA",
};
