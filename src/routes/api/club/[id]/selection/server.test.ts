import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./+server";

function createMockSelectionEvent(options: {
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
			userType: 42,
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

describe("GET /api/club/[id]/selection", () => {
	it("returns session status for valid club id", async () => {
		const event = createMockSelectionEvent({ clubId: "club-123" });
		const res = await GET(event);

		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.clubId).toBe("club-123");
	});

	it("rejects missing club id", async () => {
		const event = createMockSelectionEvent({});
		const res = await GET(event);

		expect(res.status).toBe(400);
	});
});

describe("POST /api/club/[id]/selection", () => {
	const validCandidates = [
		{ title: "Book A", author: "Author A", totalPages: 200 },
		{ title: "Book B", author: "Author B", totalPages: 300 },
	];

	it("creates roulette selection session successfully", async () => {
		const event = createMockSelectionEvent({
			clubId: "club-123",
			body: {
				mode: "roulette",
				candidates: validCandidates,
			},
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.session.mode).toBe("roulette");
		expect(data.session.candidates).toHaveLength(2);
		expect(data.session.seed).toBeTypeOf("number");
	});

	it("creates timed poll selection session with endsAt deadline", async () => {
		const event = createMockSelectionEvent({
			clubId: "club-123",
			body: {
				mode: "poll",
				candidates: validCandidates,
				pollDurationHours: 12,
			},
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.session.mode).toBe("poll");
		expect(data.session.pollDurationHours).toBe(12);
		expect(data.session.pollEndsAt).toBeDefined();
	});

	it("rejects fewer than 2 candidates", async () => {
		const event = createMockSelectionEvent({
			clubId: "club-123",
			body: {
				candidates: [{ title: "Only One", author: "Author", totalPages: 100 }],
			},
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data.error).toContain("at least 2");
	});

	it("rejects more than 12 candidates", async () => {
		const tooMany = Array.from({ length: 13 }, (_, i) => ({
			title: `Book ${i + 1}`,
			author: `Author ${i + 1}`,
			totalPages: 100,
		}));

		const event = createMockSelectionEvent({
			clubId: "club-123",
			body: {
				candidates: tooMany,
			},
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data.error).toContain("cannot exceed 12");
	});
});
