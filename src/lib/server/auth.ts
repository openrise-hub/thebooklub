import {
	AUTH_COOKIE_NAME,
	PROTECTED_ROUTE_PREFIXES,
	SESSION_MAX_AGE_SECONDS,
} from "$lib/constants/auth";
import type { RequestEvent } from "@sveltejs/kit";

export type ClubMemberRole = "admin" | "member";

export interface UserSession {
	id: string;
	email: string;
	username: string;
	isEmailVerified: boolean;
	avatarUrl: string;
	createdAt: number;
}

/**
 * Generate Gravatar URL with retro avatar fallback.
 * Uses SHA-256 / MD5 email normalization without server image storage.
 */
export async function getGravatarUrl(email: string): Promise<string> {
	const normalized = email.trim().toLowerCase();
	const msgUint8 = new TextEncoder().encode(normalized);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return `https://www.gravatar.com/avatar/${hashHex}?d=retro&s=120`;
}

/**
 * Create a signed, tamper-proof session token using Web Crypto HMAC-SHA256.
 */
export async function createSessionToken(session: UserSession, secret: string): Promise<string> {
	const payload = JSON.stringify(session);
	const encoder = new TextEncoder();
	const data = encoder.encode(payload);

	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
	const signatureHex = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	const base64Payload = btoa(payload);
	return `${base64Payload}.${signatureHex}`;
}

/**
 * Verify and parse a signed session token. Returns null if invalid or expired.
 */
export async function verifySessionToken(
	token: string,
	secret: string,
): Promise<UserSession | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 2) return null;

		const [base64Payload, signatureHex] = parts;
		const payload = atob(base64Payload);
		const session: UserSession = JSON.parse(payload);

		// Check age
		const now = Math.floor(Date.now() / 1000);
		if (now - session.createdAt > SESSION_MAX_AGE_SECONDS) {
			return null;
		}

		// Verify HMAC
		const encoder = new TextEncoder();
		const data = encoder.encode(payload);
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);

		const signatureBytes = new Uint8Array(
			signatureHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
		);

		const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, data);
		if (!isValid) return null;

		return session;
	} catch {
		return null;
	}
}

/**
 * Extract session token from cookies or Authorization header.
 */
export function extractSessionToken(event: RequestEvent): string | null {
	const cookieToken = event.cookies.get(AUTH_COOKIE_NAME);
	if (cookieToken) return cookieToken;

	const authHeader = event.request.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}

	return null;
}

/**
 * Check if a URL pathname requires authenticated access.
 */
export function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
