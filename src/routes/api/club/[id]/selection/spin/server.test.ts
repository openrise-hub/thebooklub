import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST } from "./+server";

function createMockSpinEvent(options: {
	clubId?: string;
	body?: Record<string, unknown>;
	user?: unknown;
}): RequestEvent {
	const {
		clubId,
		body,
		user = {
			id: "user-1",
			email: "admin@club.com",
			username: "AdminUser",
			isEmailVerified: true,
			avatarUrl: "",
			createdAt: Date.now(),
		},
	} = options;
	return {
		params: clubId !== undefined ? { id: clubId } : {},
		request: {
			json: async () => body ?? {},
		},
		locals: {
			user,
		},
	} as unknown as RequestEvent;
}

describe("POST /api/club/[id]/selection/spin", () => {
	const validCandidates = [
		{ id: "1", title: "Book 1", author: "Author 1", totalPages: 200 },
		{ id: "2", title: "Book 2", author: "Author 2", totalPages: 300 },
		{ id: "3", title: "Book 3", author: "Author 3", totalPages: 250 },
	];

	it("selects winner and returns spin metadata", async () => {
		const event = createMockSpinEvent({
			clubId: "club-123",
			body: {
				candidates: validCandidates,
			},
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.winnerIndex).toBeGreaterThanOrEqual(0);
		expect(data.winnerIndex).toBeLessThan(3);
		expect(data.winner).toBeDefined();
		expect(data.durationMs).toBe(5000);
		expect(data.seed).toBeTypeOf("number");
	});

	it("rejects fewer than 2 candidates", async () => {
		const event = createMockSpinEvent({
			clubId: "club-123",
			body: {
				candidates: [{ id: "1", title: "Book 1", author: "Author 1", totalPages: 200 }],
			},
		});

		const res = await POST(event);
		expect(res.status).toBe(400);
	});

	it("rejects invalid JSON payload", async () => {
		const event = {
			params: { id: "club-123" },
			locals: {
				user: {
					id: "user-1",
					email: "admin@club.com",
					username: "AdminUser",
					isEmailVerified: true,
					avatarUrl: "",
					createdAt: Date.now(),
				},
			},
			request: {
				json: async () => {
					throw new Error("SyntaxError");
				},
			},
		} as unknown as RequestEvent;

		const res = await POST(event);
		expect(res.status).toBe(400);
	});
});
