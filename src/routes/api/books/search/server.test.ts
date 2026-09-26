import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./+server";

function createMockGetEvent(urlQuery: string, fetchFn: typeof fetch): RequestEvent {
	const url = new URL(`http://localhost/api/books/search?${urlQuery}`);
	return {
		url,
		fetch: fetchFn,
		request: new Request(url),
		locals: {},
	} as unknown as RequestEvent;
}

describe("GET /api/books/search", () => {
	it("returns 400 Bad Request if query parameter q is missing or too short", async () => {
		const mockFetch = vi.fn();
		const event = createMockGetEvent("q=a", mockFetch as unknown as typeof fetch);

		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("must be at least 2 characters");
	});

	it("returns 200 OK with normalized search results when query is valid", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				totalItems: 1,
				items: [
					{
						id: "dune1",
						volumeInfo: {
							title: "Dune Messiah",
							authors: ["Frank Herbert"],
							pageCount: 256,
						},
					},
				],
			}),
		});

		const event = createMockGetEvent("q=Dune", mockFetch as unknown as typeof fetch);
		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.query).toBe("Dune");
		expect(data.count).toBe(1);
		expect(data.sourceProvider).toBe("google_books");
		expect(data.results[0].title).toBe("Dune Messiah");
	});
});
