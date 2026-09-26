import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST } from "./+server";

function createMockEvent(user: UserSession | null, body: Record<string, unknown>): RequestEvent {
	const request = new Request("http://localhost/api/club/create", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	return {
		request,
		locals: { user },
		url: new URL("http://localhost/api/club/create"),
	} as unknown as RequestEvent;
}

describe("POST /api/club/create", () => {
	const verifiedAdmin: UserSession = {
		id: "user-admin-1",
		email: "admin@example.com",
		username: "club_founder",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/admin",
		createdAt: 1000,
	};

	const unverifiedAdmin: UserSession = {
		...verifiedAdmin,
		isEmailVerified: false,
	};

	it("returns 401 Unauthorized if no active user session exists", async () => {
		const event = createMockEvent(null, {
			name: "Sci-Fi Readers",
			cadence: "weekly",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Unauthorized");
	});

	it("returns 403 Forbidden if user email is unverified", async () => {
		const event = createMockEvent(unverifiedAdmin, {
			name: "Sci-Fi Readers",
			cadence: "weekly",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(403);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Email verification required");
	});

	it("returns 400 Bad Request if club name is under 3 characters", async () => {
		const event = createMockEvent(verifiedAdmin, {
			name: "No",
			cadence: "weekly",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Club name must be between 3 and 50 characters");
	});

	it("returns 400 Bad Request if club name exceeds 50 characters", async () => {
		const event = createMockEvent(verifiedAdmin, {
			name: "A".repeat(51),
			cadence: "weekly",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Club name must be between 3 and 50 characters");
	});

	it("returns 400 Bad Request if cadence type is invalid", async () => {
		const event = createMockEvent(verifiedAdmin, {
			name: "Valid Club Name",
			cadence: "invalid_cadence",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Invalid reading cadence");
	});

	it("successfully creates club, generates valid invite code, and assigns admin role", async () => {
		const event = createMockEvent(verifiedAdmin, {
			name: "The Friday Book Worms",
			cadence: "monthly",
			advancedReviews: true,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.name).toBe("The Friday Book Worms");
		expect(data.cadence).toBe("monthly");
		expect(data.advancedReviews).toBe(true);
		expect(data.role).toBe("admin");
		expect(data.inviteCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(data.redirectUrl).toBe(`/club/${data.inviteCode}`);
	});
});
