import type { ServerEnv } from "$lib/server/env";
import type { NormalizedBook } from "$lib/types/book";
import type { ReadingCycle } from "$lib/types/cycle";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./+server";

function createMockCronEvent(
	method: "GET" | "POST",
	headers: Record<string, string> = {},
	body?: unknown,
	envOverrides: Partial<ServerEnv> = {},
): RequestEvent {
	const request = new Request("http://localhost/api/cron/purge", {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	const mockEnv: ServerEnv = {
		AUTH_SECRET: "test-auth-secret",
		...envOverrides,
	};

	return {
		request,
		locals: { env: mockEnv },
		url: new URL("http://localhost/api/cron/purge"),
	} as unknown as RequestEvent;
}

const mockBook: NormalizedBook = {
	id: "b1",
	title: "The Pragmatic Programmer",
	authors: ["Andy Hunt"],
	pageCount: 352,
	requiresManualPages: false,
	coverUrl: null,
	sourceProvider: "google_books",
};

describe("Cron Purge Endpoint (/api/cron/purge)", () => {
	it("rejects unauthorized cron requests when CRON_SECRET is configured", async () => {
		const event = createMockCronEvent("POST", { authorization: "Bearer wrong-token" }, undefined, {
			CRON_SECRET: "super-secret-cron-token",
		});
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Unauthorized");
	});

	it("authenticates with valid Bearer token", async () => {
		const event = createMockCronEvent(
			"POST",
			{ authorization: "Bearer super-secret-cron-token" },
			undefined,
			{ CRON_SECRET: "super-secret-cron-token" },
		);
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.evaluatedCount).toBe(0);
	});

	it("authenticates with valid x-cron-secret header", async () => {
		const event = createMockCronEvent(
			"GET",
			{ "x-cron-secret": "super-secret-cron-token" },
			undefined,
			{ CRON_SECRET: "super-secret-cron-token" },
		);
		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("evaluates cycles provided in payload and executes purge reporting", async () => {
		const now = Date.now();

		const expiredCycle: ReadingCycle = {
			id: "cycle-expired-1",
			clubId: "club-99",
			book: mockBook,
			startDate: now - 30 * 24 * 60 * 60 * 1000,
			endDate: now - 26 * 60 * 60 * 1000,
			cadence: "weekly",
			status: "completed",
			pdfKey: "clubs/club-99/cycles/cycle-expired-1/doc.pdf",
		};

		const event = createMockCronEvent(
			"POST",
			{},
			{
				cycles: [expiredCycle],
			},
			{},
		);
		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.evaluatedCount).toBe(1);
		expect(data.purgedCount).toBe(1);
		expect(data.results[0].action).toBe("purged");
		expect(data.updatedCycles[0].status).toBe("purged");
		expect(data.updatedCycles[0].pdfKey).toBeNull();
	});
});
