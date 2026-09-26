import {
	AVATAR_SIZE_MAP,
	type AvatarSizeName,
	DEFAULT_AVATAR_FALLBACK,
	DEFAULT_AVATAR_SIZE,
	type GravatarFallbackMode,
} from "$lib/constants/avatars";

export interface GravatarOptions {
	size?: number | AvatarSizeName;
	fallback?: GravatarFallbackMode;
	rating?: "g" | "pg" | "r" | "x";
}

/**
 * Normalizes an email address according to Gravatar specifications:
 * leading and trailing whitespace trimmed, and all letters in lowercase.
 */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Generates a SHA-256 hex digest for an email address using Web Crypto.
 */
export async function hashEmail(email: string): Promise<string> {
	const normalized = normalizeEmail(email);
	const encoder = new TextEncoder();
	const data = encoder.encode(normalized);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Resolves a numeric pixel size from a number or AvatarSizeName key.
 */
export function resolveAvatarSize(size?: number | AvatarSizeName): number {
	if (typeof size === "number" && Number.isFinite(size) && size > 0) {
		return Math.round(size);
	}
	if (typeof size === "string" && size in AVATAR_SIZE_MAP) {
		return AVATAR_SIZE_MAP[size as AvatarSizeName];
	}
	return DEFAULT_AVATAR_SIZE;
}

/**
 * Constructs a fully qualified Gravatar URL for a given email address.
 */
export async function getGravatarUrl(
	email: string,
	options: GravatarOptions = {},
): Promise<string> {
	const hash = await hashEmail(email);
	const size = resolveAvatarSize(options.size);
	const fallback = options.fallback || DEFAULT_AVATAR_FALLBACK;
	const rating = options.rating ? `&r=${encodeURIComponent(options.rating)}` : "";

	return `https://www.gravatar.com/avatar/${hash}?d=${encodeURIComponent(fallback)}&s=${size}${rating}`;
}

/**
 * Constructs a Gravatar URL when the email hash is already computed.
 */
export function getGravatarUrlFromHash(hash: string, options: GravatarOptions = {}): string {
	const size = resolveAvatarSize(options.size);
	const fallback = options.fallback || DEFAULT_AVATAR_FALLBACK;
	const rating = options.rating ? `&r=${encodeURIComponent(options.rating)}` : "";

	return `https://www.gravatar.com/avatar/${hash}?d=${encodeURIComponent(fallback)}&s=${size}${rating}`;
}

/**
 * Extracts up to 2 uppercase initials from a display name or email address.
 */
export function extractInitials(name?: string): string {
	if (!name || name.trim().length === 0) {
		return "?";
	}

	const cleaned = name.trim();
	const parts = cleaned.split(/\s+/).filter(Boolean);

	if (parts.length === 1) {
		return cleaned.slice(0, 2).toUpperCase();
	}

	const firstInitial = parts[0]?.[0] || "";
	const lastInitial = parts[parts.length - 1]?.[0] || "";
	return (firstInitial + lastInitial).toUpperCase();
}

const AVATAR_BG_PALETTE = [
	"var(--brand-primary)",
	"var(--color-blue)",
	"var(--color-green)",
	"var(--color-yellow)",
	"var(--color-red)",
	"var(--color-purple)",
];

/**
 * Computes a deterministic background color from a string seed (e.g. username).
 */
export function getAvatarSeedColor(seed?: string): string {
	if (!seed || seed.trim().length === 0) {
		return AVATAR_BG_PALETTE[0];
	}

	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash + seed.charCodeAt(i)) % AVATAR_BG_PALETTE.length;
	}

	return AVATAR_BG_PALETTE[hash] || AVATAR_BG_PALETTE[0];
}
