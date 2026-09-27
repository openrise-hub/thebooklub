export const SELECTION_MODES = ["roulette", "poll"] as const;
export type SelectionMode = (typeof SELECTION_MODES)[number];

export const SELECTION_STATUSES = ["draft", "active", "completed"] as const;
export type SelectionStatus = (typeof SELECTION_STATUSES)[number];

export const SELECTION_THEME_COLORS = ["purple", "blue", "green", "yellow", "red"] as const;
export type SelectionThemeColor = (typeof SELECTION_THEME_COLORS)[number];

export const SELECTION_COLOR_PALETTE = [
	"#46178f", // purple
	"#1368ce", // blue
	"#26890c", // green
	"#ffa602", // yellow
	"#e21b3c", // red
	"#6a2cd8", // violet
	"#0c468c", // deep blue
	"#195b07", // dark green
	"#b87700", // dark yellow
	"#9e1329", // dark red
	"#242834", // elevated dark
	"#7a3e26", // terracotta
] as const;

export const POLL_DURATION_PRESETS_HOURS = [1, 6, 12, 24, 48, 72] as const;
export const DEFAULT_SELECTION_MODE: SelectionMode = "roulette";
export const DEFAULT_POLL_HOURS = 24;
