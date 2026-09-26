/**
 * Centralized avatar sizes, default fallbacks, and gravatar configuration.
 * Avoids magic numbers in avatar components and utilities.
 */

export const AVATAR_SIZE_MAP = {
	xs: 24,
	sm: 32,
	md: 40,
	lg: 64,
	xl: 96,
	xxl: 120,
} as const;

export type AvatarSizeName = keyof typeof AVATAR_SIZE_MAP;

export const AVATAR_FALLBACK_MODES = [
	"retro",
	"robohash",
	"identicon",
	"mp",
	"wavatar",
	"monsterid",
] as const;

export type GravatarFallbackMode = (typeof AVATAR_FALLBACK_MODES)[number];

export const DEFAULT_AVATAR_FALLBACK: GravatarFallbackMode = "retro";
export const DEFAULT_AVATAR_SIZE = AVATAR_SIZE_MAP.xxl;
