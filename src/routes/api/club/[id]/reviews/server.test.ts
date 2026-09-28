import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./+server";

function createMockReviewEvent(
	method: "GET" | "POST",
	user: UserSession | null,
	clubId: string | undefined,
	body?: unknown,
): RequestEvent {
	const request = new Request(`http://localhost/api/club/${clubId ?? ""}/reviews`, {
		method,
		headers: { "Content-Type": "application/json" },
		body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
	});

	return {
		request,
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/api/club/${clubId ?? ""}/reviews`),
	} as unknown as RequestEvent;
}

describe("Reviews API Endpoints (/api/club/[id]/reviews)", () => {
	const reviewer: UserSession = {
		id: "user-reviewer-1",
		email: "reviewer@example.com",
		username: "StarCritic",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/critic",
		createdAt: 1000,
	};

	describe("GET /api/club/[id]/reviews", () => {
		it("returns 401 Unauthorized if user is not authenticated", async () => {
			const event = createMockReviewEvent("GET", null, "READ-4821");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Authentication required");
		});

		it("returns 400 Bad Request if club ID is missing", async () => {
			const event = createMockReviewEvent("GET", reviewer, "");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toBe("Club ID is required");
		});

		it("returns 200 with reviews array and criteria averages for valid club", async () => {
			const event = createMockReviewEvent("GET", reviewer, "READ-4821");
			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(Array.isArray(data.reviews)).toBe(true);
			expect(data.averageRating).toBeGreaterThanOrEqual(0);
			expect(data.criteriaAverages).toBeDefined();
		});
	});

	describe("POST /api/club/[id]/reviews", () => {
		it("returns 401 Unauthorized if user is not authenticated", async () => {
			const event = createMockReviewEvent("POST", null, "READ-4821", {
				rating: 4.5,
				cycleId: "cycle-1",
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
		});

		it("returns 400 Bad Request if rating is out of bounds", async () => {
			const event = createMockReviewEvent("POST", reviewer, "READ-4821", {
				rating: 6.0,
				cycleId: "cycle-1",
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("between 1 and 5");
		});

		it("returns 400 Bad Request if rating step increment is invalid", async () => {
			const event = createMockReviewEvent("POST", reviewer, "READ-4821", {
				rating: 3.3,
				cycleId: "cycle-1",
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("increments of 0.5");
		});

		it("returns 400 Bad Request if criteria score is invalid", async () => {
			const event = createMockReviewEvent("POST", reviewer, "READ-4821", {
				rating: 4.0,
				cycleId: "cycle-1",
				criteria: {
					plot: 6,
					characters: 4,
					pacing: 3,
					writing: 4,
					emotion: 5,
				},
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Score for plot must be an integer between 1 and 5");
		});

		it("returns 200 and saves review with criteria on valid submission", async () => {
			const event = createMockReviewEvent("POST", reviewer, "READ-4821", {
				rating: 4.5,
				comment: "Masterclass in speculative fiction!",
				cycleId: "cycle-1",
				criteria: {
					plot: 5,
					characters: 4,
					pacing: 4,
					writing: 5,
					emotion: 4,
				},
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.review.rating).toBe(4.5);
			expect(data.review.comment).toBe("Masterclass in speculative fiction!");
			expect(data.review.username).toBe("StarCritic");
			expect(data.review.criteria).toEqual({
				plot: 5,
				characters: 4,
				pacing: 4,
				writing: 5,
				emotion: 4,
			});
		});

		it("upserts review when user updates their existing review", async () => {
			const event = createMockReviewEvent("POST", reviewer, "READ-4821", {
				rating: 5.0,
				comment: "Updated: definitely a 5-star masterpiece!",
				cycleId: "cycle-1",
				criteria: {
					plot: 5,
					characters: 5,
					pacing: 5,
					writing: 5,
					emotion: 5,
				},
			});
			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.review.rating).toBe(5.0);
			expect(data.review.comment).toContain("Updated:");
			expect(data.review.criteria?.plot).toBe(5);
		});
	});
});
