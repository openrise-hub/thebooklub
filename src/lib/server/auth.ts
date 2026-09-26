import {
	AUTH_COOKIE_NAME,
	PROTECTED_ROUTE_PREFIXES,
	SESSION_MAX_AGE_SECONDS,
} from "$lib/constants/auth";
import { getGravatarUrl } from "$lib/utils/gravatar";
import type { RequestEvent } from "@sveltejs/kit";

export { getGravatarUrl };

export type ClubMemberRole = "admin" | "member";

export interface UserSession {
	id: string;
	email: string;
	username: string;
	isEmailVerified: boolean;
	avatarUrl: string;
	createdAt: number;
}

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

		const now = Math.floor(Date.now() / 1000);
		if (now - session.createdAt > SESSION_MAX_AGE_SECONDS) {
			return null;
		}

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

export function extractSessionToken(event: RequestEvent): string | null {
	const cookieToken = event.cookies.get(AUTH_COOKIE_NAME);
	if (cookieToken) return cookieToken;

	const authHeader = event.request.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}

	return null;
}

export function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
