import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./+server";

function createMockPostEvent(
	user: UserSession | null,
	clubId: string | undefined,
	body: unknown,
): RequestEvent {
	const request = new Request(`http://localhost/api/club/${clubId ?? ""}/progress`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});

	return {
		request,
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/api/club/${clubId ?? ""}/progress`),
	} as unknown as RequestEvent;
}

function createMockGetEvent(user: UserSession | null, clubId: string | undefined): RequestEvent {
	return {
		request: new Request(`http://localhost/api/club/${clubId ?? ""}/progress`),
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/api/club/${clubId ?? ""}/progress`),
	} as unknown as RequestEvent;
}

describe("POST /api/club/[id]/progress", () => {
	const verifiedUser: UserSession = {
		id: "user-sync-99",
		email: "sync@example.com",
		username: "speedsync",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/sync",
		createdAt: 1000,
	};

	it("returns 401 Unauthorized if user is not authenticated", async () => {
		const event = createMockPostEvent(null, "club-123", {
			currentPage: 42,
			totalPages: 300,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Authentication required");
	});

	it("returns 400 Bad Request if club ID is missing", async () => {
		const event = createMockPostEvent(verifiedUser, "", {
			currentPage: 42,
			totalPages: 300,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Club ID is required");
	});

	it("returns 400 Bad Request if body is invalid JSON", async () => {
		const event = createMockPostEvent(verifiedUser, "club-123", "{ invalid json");
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Invalid JSON");
	});

	it("returns 400 Bad Request if currentPage is negative", async () => {
		const event = createMockPostEvent(verifiedUser, "club-123", {
			currentPage: -5,
			totalPages: 100,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("cannot be negative");
	});

	it("returns 400 Bad Request if currentPage exceeds totalPages", async () => {
		const event = createMockPostEvent(verifiedUser, "club-123", {
			currentPage: 250,
			totalPages: 200,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("cannot exceed total pages");
	});

	it("returns 200 and calculates reading percentage accurately", async () => {
		const event = createMockPostEvent(verifiedUser, "club-123", {
			currentPage: 184,
			totalPages: 412,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.clubId).toBe("club-123");
		expect(data.userId).toBe("user-sync-99");
		expect(data.currentPage).toBe(184);
		expect(data.totalPages).toBe(412);
		expect(data.percent).toBe(45);
		expect(data.updatedAt).toBeGreaterThan(0);
	});
});

describe("GET /api/club/[id]/progress", () => {
	const verifiedUser: UserSession = {
		id: "user-sync-99",
		email: "sync@example.com",
		username: "speedsync",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/sync",
		createdAt: 1000,
	};

	it("returns 401 Unauthorized if user is not authenticated", async () => {
		const event = createMockGetEvent(null, "club-123");
		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Authentication required");
	});

	it("returns 400 Bad Request if club ID is missing", async () => {
		const event = createMockGetEvent(verifiedUser, "");
		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Club ID is required");
	});

	it("returns 200 with reading progress status for authenticated user", async () => {
		const event = createMockGetEvent(verifiedUser, "club-123");
		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.clubId).toBe("club-123");
		expect(data.userId).toBe("user-sync-99");
		expect(data.currentPage).toBeDefined();
		expect(data.totalPages).toBeDefined();
		expect(data.percent).toBeDefined();
	});
});
