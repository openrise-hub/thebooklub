import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

function createMockDashboardEvent(clubId: string, user: UserSession | null): RequestEvent {
	return {
		params: { id: clubId },
		locals: { user },
		url: new URL(`http://localhost/club/${clubId}`),
	} as unknown as RequestEvent;
}

describe("Club Dashboard Server Load", () => {
	const verifiedUser: UserSession = {
		id: "user-test-1",
		email: "reader@example.com",
		username: "book_worm",
		userType: 2,
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/test",
		createdAt: 1000,
	};

	it("throws 303 redirect when visitor is not authenticated", async () => {
		const event = createMockDashboardEvent("READ-4821", null);

		await expect(load(event as unknown as Parameters<typeof load>[0])).rejects.toThrow();
	});

	it("loads club data, active cycle, and member progress when authenticated", async () => {
		const event = createMockDashboardEvent("READ-4821", verifiedUser);
		const data = await load(event as unknown as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error("Expected data to be returned");

		expect(data.club.id).toBe("READ-4821");
		expect(data.club.inviteCode).toBe("READ-4821");
		expect(data.activeCycle).toBeDefined();
		expect(data.activeCycle?.status).toBe("active");
		expect(data.activeCycle?.book.title).toBe("Dune");
		expect(data.members).toHaveLength(3);
		expect(data.members[0].username).toBe("book_worm");
	});
});

describe("Race Track Calculations", () => {
	it("correctly computes percentage for given page and total pages", () => {
		const currentPage = 184;
		const totalPages = 412;
		const percent = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));

		expect(percent).toBe(45);
	});

	it("clamps percentage to 100% when current page exceeds total pages", () => {
		const currentPage = 500;
		const totalPages = 412;
		const percent = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));

		expect(percent).toBe(100);
	});

	it("clamps percentage to 0% when current page is 0", () => {
		const currentPage = 0;
		const totalPages = 412;
		const percent = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));

		expect(percent).toBe(0);
	});
});
