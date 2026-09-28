import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./+server";

function createMockDiscussionEvent(
	method: "GET" | "POST",
	user: UserSession | null,
	clubId: string | undefined,
	body?: unknown,
): RequestEvent {
	const request = new Request(`http://localhost/api/club/${clubId ?? ""}/discussions`, {
		method,
		headers: { "Content-Type": "application/json" },
		body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
	});

	return {
		request,
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/api/club/${clubId ?? ""}/discussions`),
	} as unknown as RequestEvent;
}

describe("Discussion API Endpoints (/api/club/[id]/discussions)", () => {
	const testUser: UserSession = {
		id: "user-commenter-1",
		email: "commenter@example.com",
		username: "BookWorm99",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/worm99",
		createdAt: 1000,
	};

	describe("GET /api/club/[id]/discussions", () => {
		it("returns 401 Unauthorized if user is not authenticated", async () => {
			const event = createMockDiscussionEvent("GET", null, "READ-4821");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Authentication required");
		});

		it("returns 400 Bad Request if club ID is missing", async () => {
			const event = createMockDiscussionEvent("GET", testUser, "");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toBe("Club ID is required");
		});

		it("returns 200 with list of messages for authenticated user", async () => {
			const event = createMockDiscussionEvent("GET", testUser, "READ-4821");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(Array.isArray(data.messages)).toBe(true);
		});
	});

	describe("POST /api/club/[id]/discussions", () => {
		it("returns 401 Unauthorized if user is not authenticated", async () => {
			const event = createMockDiscussionEvent("POST", null, "READ-4821", {
				content: "Great page!",
				pageReference: 20,
				cycleId: "cycle-1",
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
		});

		it("returns 400 Bad Request if message body is invalid JSON", async () => {
			const event = createMockDiscussionEvent("POST", testUser, "READ-4821", "{ invalid json");
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Invalid JSON");
		});

		it("returns 400 Bad Request if content is empty", async () => {
			const event = createMockDiscussionEvent("POST", testUser, "READ-4821", {
				content: "   ",
				pageReference: 20,
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("cannot be empty");
		});

		it("returns 400 Bad Request if page reference is negative", async () => {
			const event = createMockDiscussionEvent("POST", testUser, "READ-4821", {
				content: "Thoughts",
				pageReference: -10,
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("cannot be negative");
		});

		it("returns 200 and created message on valid payload", async () => {
			const event = createMockDiscussionEvent("POST", testUser, "READ-4821", {
				content: "The plot twist at the midway point is brilliant!",
				pageReference: 142,
				cycleId: "cycle-1",
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message.content).toBe("The plot twist at the midway point is brilliant!");
			expect(data.message.pageReference).toBe(142);
			expect(data.message.username).toBe("BookWorm99");
			expect(data.message.userId).toBe("user-commenter-1");
			expect(data.message.createdAt).toBeGreaterThan(0);
		});
	});
});
