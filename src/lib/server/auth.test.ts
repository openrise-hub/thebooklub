import { describe, expect, it } from "vitest";
import {
	type UserSession,
	createSessionToken,
	getGravatarUrl,
	isProtectedRoute,
	verifySessionToken,
} from "./auth";
import { validateEnv } from "./env";

const mockUser: UserSession = {
	id: "user-123",
	email: "reader@example.com",
	username: "BookWorm",
	userType: 2,
	isEmailVerified: true,
	avatarUrl: "https://www.gravatar.com/avatar/abc?d=retro&s=120",
	createdAt: Math.floor(Date.now() / 1000),
};

const mockSecret = "test-secret-key-32-chars-long-minimum-length";

describe("Gravatar URL Generator", () => {
	it("normalizes email and generates retro avatar fallback", async () => {
		const url1 = await getGravatarUrl("Reader@Example.COM ");
		const url2 = await getGravatarUrl("reader@example.com");

		expect(url1).toBe(url2);
		expect(url1).toContain("https://www.gravatar.com/avatar/");
		expect(url1).toContain("d=retro&s=120");
	});
});

describe("Session Token Signing and Verification", () => {
	it("signs and verifies valid session tokens", async () => {
		const token = await createSessionToken(mockUser, mockSecret);
		expect(typeof token).toBe("string");
		expect(token).toContain(".");

		const verified = await verifySessionToken(token, mockSecret);
		expect(verified).not.toBeNull();
		expect(verified?.id).toBe(mockUser.id);
		expect(verified?.email).toBe(mockUser.email);
		expect(verified?.username).toBe(mockUser.username);
		expect(verified?.isEmailVerified).toBe(true);
	});

	it("rejects tampered tokens", async () => {
		const token = await createSessionToken(mockUser, mockSecret);
		const tamperedToken = `${token}x`;

		const verified = await verifySessionToken(tamperedToken, mockSecret);
		expect(verified).toBeNull();
	});

	it("rejects tokens with incorrect secret", async () => {
		const token = await createSessionToken(mockUser, mockSecret);
		const wrongSecret = "wrong-secret-key-32-chars-long-different";

		const verified = await verifySessionToken(token, wrongSecret);
		expect(verified).toBeNull();
	});

	it("rejects expired tokens", async () => {
		const expiredUser: UserSession = {
			...mockUser,
			createdAt: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 35, // 35 days ago (max is 30)
		};

		const token = await createSessionToken(expiredUser, mockSecret);
		const verified = await verifySessionToken(token, mockSecret);
		expect(verified).toBeNull();
	});
});

describe("Route Protection Rules", () => {
	it("identifies protected club routes", () => {
		expect(isProtectedRoute("/club/read-4821")).toBe(true);
		expect(isProtectedRoute("/club/new")).toBe(true);
		expect(isProtectedRoute("/api/club/123/pdf")).toBe(true);
	});

	it("identifies public landing and open API routes", () => {
		expect(isProtectedRoute("/")).toBe(false);
		expect(isProtectedRoute("/api/books/search")).toBe(false);
	});
});

describe("Environment Validation", () => {
	it("provides safe defaults in development", () => {
		const env = validateEnv({});
		expect(env.AUTH_SECRET).toBeDefined();
		expect(env.AUTH_PROVIDER).toBe("local");
	});

	it("reads custom environment variables when provided", () => {
		const env = validateEnv({
			AUTH_SECRET: "custom-secret-key-123456789012345",
			AUTH_PROVIDER: "clerk",
			CLERK_SECRET_KEY: "sk_test_123",
		});

		expect(env.AUTH_SECRET).toBe("custom-secret-key-123456789012345");
		expect(env.AUTH_PROVIDER).toBe("clerk");
		expect(env.CLERK_SECRET_KEY).toBe("sk_test_123");
	});
});
