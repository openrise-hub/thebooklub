/**
 * Centralized UI, theme, and client storage constants.
 */

export const THEMES = ["classic", "midnight", "bookshelf"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "classic";

export const STORAGE_KEYS = {
	THEME: "thebooklub_theme",
	PENDING_CLUB_CODE: "pending_club_code",
	READER_PAGE: (clubId: string) => `reader_page_${clubId}`,
} as const;

export const ACTION_COLOR_VARIANTS = ["red", "blue", "yellow", "green", "purple"] as const;
export type ActionColorVariant = (typeof ACTION_COLOR_VARIANTS)[number];

export const SPOILER_BLUR_RADIUS = "8px";

/**
 * WCAG 2.1 & Tactile Accessibility Standards
 */
export const MIN_TOUCH_TARGET_PX = 44;
export const WCAG_AA_NORMAL_CONTRAST = 4.5;
export const WCAG_AA_LARGE_CONTRAST = 3.0;
export const WCAG_AAA_NORMAL_CONTRAST = 7.0;
