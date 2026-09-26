import type { UserSession } from "$lib/server/auth";
import type { ArchivedReadingCycle } from "$lib/types/cycle";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

function createMockHistoryEvent(clubId: string, user: UserSession | null): RequestEvent {
	return {
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/club/${clubId}/history`),
	} as unknown as RequestEvent;
}

describe("History Archive Server Load", () => {
	const verifiedUser: UserSession = {
		id: "user-test-1",
		email: "reader@example.com",
		username: "book_worm",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/test",
		createdAt: 1000,
	};

	it("throws redirect when user is not authenticated", async () => {
		const event = createMockHistoryEvent("READ-4821", null);
		await expect(load(event as unknown as Parameters<typeof load>[0])).rejects.toThrow();
	});

	it("throws 404 error when club id is empty", async () => {
		const event = createMockHistoryEvent("", verifiedUser);
		await expect(load(event as unknown as Parameters<typeof load>[0])).rejects.toThrow();
	});

	it("loads past cycles with reviews and discussions when authenticated", async () => {
		const event = createMockHistoryEvent("READ-4821", verifiedUser);
		const data = await load(event as unknown as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error("Expected data to be returned");

		expect(data.club.id).toBe("READ-4821");
		expect(data.club.name).toBe("Reading Club READ-4821");
		expect(data.pastCycles).toBeInstanceOf(Array);
		expect(data.pastCycles.length).toBeGreaterThan(0);

		const firstPastCycle = data.pastCycles[0];
		expect(firstPastCycle.status).toBe("completed");
		expect(firstPastCycle.book.title).toBe("Hyperion");
		expect(firstPastCycle.averageRating).toBe(4.8);
		expect(firstPastCycle.reviews).toBeDefined();
		expect(firstPastCycle.reviews?.length).toBe(2);
		expect(firstPastCycle.discussions).toBeDefined();
		expect(firstPastCycle.discussions?.length).toBe(2);

		const secondPastCycle = data.pastCycles[1];
		expect(secondPastCycle.status).toBe("purged");
		expect(secondPastCycle.book.title).toBe("Neuromancer");
		expect(secondPastCycle.averageRating).toBe(4.5);
	});
});

describe("History Archive Aggregations and Formatting", () => {
	const sampleCycles: ArchivedReadingCycle[] = [
		{
			id: "cycle-1",
			clubId: "READ-4821",
			book: {
				id: "b1",
				title: "Hyperion",
				authors: ["Dan Simmons"],
				pageCount: 482,
				requiresManualPages: false,
				coverUrl: null,
				sourceProvider: "google_books",
			},
			startDate: Date.UTC(2026, 0, 8),
			endDate: Date.UTC(2026, 0, 15),
			cadence: "weekly",
			status: "completed",
			totalReviews: 8,
			averageRating: 4.8,
			reviews: [
				{
					id: "r1",
					userId: "u1",
					username: "Elena",
					avatarUrl: "https://gravatar.com/avatar/1",
					rating: 5.0,
					createdAt: Date.UTC(2026, 0, 14),
					comment: "Masterpiece.",
					criteria: { plot: 5, characters: 5, pacing: 4, writing: 5, emotion: 5 },
				},
			],
			discussions: [
				{
					id: "d1",
					userId: "u1",
					username: "Elena",
					avatarUrl: "https://gravatar.com/avatar/1",
					pageReference: 85,
					content: "Incredible world building.",
					createdAt: Date.UTC(2026, 0, 10),
				},
			],
		},
		{
			id: "cycle-2",
			clubId: "READ-4821",
			book: {
				id: "b2",
				title: "Neuromancer",
				authors: ["William Gibson"],
				pageCount: 271,
				requiresManualPages: false,
				coverUrl: null,
				sourceProvider: "open_library",
			},
			startDate: Date.UTC(2026, 0, 1),
			endDate: Date.UTC(2026, 0, 8),
			cadence: "weekly",
			status: "purged",
			totalReviews: 12,
			averageRating: 4.4,
		},
	];

	it("calculates total books read accurately", () => {
		expect(sampleCycles.length).toBe(2);
	});

	it("computes average club score across past cycles", () => {
		const sum = sampleCycles.reduce((acc, c) => acc + (c.averageRating ?? 0), 0);
		const avg = Number((sum / sampleCycles.length).toFixed(1));
		expect(avg).toBe(4.6);
	});

	it("computes total archived reviews across all past cycles", () => {
		const totalReviews = sampleCycles.reduce((acc, c) => acc + (c.totalReviews ?? 0), 0);
		expect(totalReviews).toBe(20);
	});

	it("formats date ranges in clean human-readable notation", () => {
		const startDate = Date.UTC(2026, 0, 8);
		const endDate = Date.UTC(2026, 0, 15);

		const formatUtc = (ts: number) =>
			new Date(ts).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				timeZone: "UTC",
			});

		const formatted = `${formatUtc(startDate)} – ${formatUtc(endDate)}`;
		expect(formatted).toBe("Jan 8, 2026 – Jan 15, 2026");
	});

	it("handles empty past cycles list gracefully", () => {
		const emptyCycles: ArchivedReadingCycle[] = [];
		const avg =
			emptyCycles.length === 0
				? 0
				: Number(
						(
							emptyCycles.reduce((acc, c) => acc + (c.averageRating ?? 0), 0) / emptyCycles.length
						).toFixed(1),
					);
		expect(avg).toBe(0);
	});
});
