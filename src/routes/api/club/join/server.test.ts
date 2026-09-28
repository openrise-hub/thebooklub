import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST } from "./+server";

function createMockEvent(user: UserSession | null, body: Record<string, unknown>): RequestEvent {
	const request = new Request("http://localhost/api/club/join", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	return {
		request,
		locals: { user },
		url: new URL("http://localhost/api/club/join"),
	} as unknown as RequestEvent;
}

describe("POST /api/club/join", () => {
	const verifiedUser: UserSession = {
		id: "user-123",
		email: "user@example.com",
		username: "reader123",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/123",
		createdAt: 1000,
	};

	const unverifiedUser: UserSession = {
		...verifiedUser,
		isEmailVerified: false,
	};

	it("returns 401 Unauthorized if user is not authenticated", async () => {
		const event = createMockEvent(null, { code: "READ-4821" });
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Unauthorized");
	});

	it("returns 403 Forbidden if user email is not verified", async () => {
		const event = createMockEvent(unverifiedUser, { code: "READ-4821" });
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(403);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Email verification required");
	});

	it("returns 400 Bad Request if code format is invalid", async () => {
		const event = createMockEvent(verifiedUser, { code: "BAD" });
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Invalid code format");
	});

	it("returns 200 and redirect URL for valid invite code", async () => {
		const event = createMockEvent(verifiedUser, { code: "read-4821" });
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.clubId).toBe("READ-4821");
		expect(data.redirectUrl).toBe("/club/READ-4821");
	});
});
