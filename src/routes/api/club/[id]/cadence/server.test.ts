import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST } from "./+server";

function createMockCadenceEvent(
	user: UserSession | null,
	clubId: string | undefined,
	body: unknown,
): RequestEvent {
	const request = new Request(`http://localhost/api/club/${clubId ?? ""}/cadence`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});

	return {
		request,
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/api/club/${clubId ?? ""}/cadence`),
	} as unknown as RequestEvent;
}

describe("POST /api/club/[id]/cadence", () => {
	const verifiedUser: UserSession = {
		id: "admin-user",
		email: "admin@example.com",
		username: "clubadmin",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/admin",
		createdAt: 1000,
	};

	it("returns 401 Unauthorized if user is not authenticated", async () => {
		const event = createMockCadenceEvent(null, "club-1", {
			endDate: Date.now() + 1000000,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Authentication required");
	});

	it("returns 400 Bad Request if club ID is missing", async () => {
		const event = createMockCadenceEvent(verifiedUser, "", {
			endDate: Date.now() + 1000000,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toBe("Club ID is required");
	});

	it("returns 400 Bad Request if extended deadline is in the past", async () => {
		const event = createMockCadenceEvent(verifiedUser, "club-1", {
			endDate: Date.now() - 5000,
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("must be in the future");
	});

	it("returns 400 Bad Request if cadence type is invalid", async () => {
		const event = createMockCadenceEvent(verifiedUser, "club-1", {
			endDate: Date.now() + 86400000,
			cadence: "biweekly",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Invalid cadence type");
	});

	it("returns 200 and resets status to active with purge aborted", async () => {
		const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
		const event = createMockCadenceEvent(verifiedUser, "club-1", {
			endDate: futureDate,
			cadence: "custom",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.clubId).toBe("club-1");
		expect(data.status).toBe("active");
		expect(data.purgeAborted).toBe(true);
		expect(data.endDate).toBe(futureDate);
	});

	it("returns 403 Forbidden if non-admin member attempts cadence modification", async () => {
		const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
		const event = createMockCadenceEvent(verifiedUser, "club-1", {
			endDate: futureDate,
			cadence: "custom",
			userRole: "member",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(403);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Only club administrators");
	});
});
