import { describe, expect, it, vi } from "vitest";
import { fetchGoogleBooks } from "./google";
import { fetchOpenLibrary } from "./openlibrary";
import { searchBooks } from "./search";

describe("fetchGoogleBooks", () => {
	it("returns empty array when query is empty", async () => {
		const result = await fetchGoogleBooks("  ");
		expect(result).toEqual([]);
	});

	it("normalizes Google Books payload and extracts HTTPS covers and page count", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				totalItems: 1,
				items: [
					{
						id: "g123",
						volumeInfo: {
							title: "Dune",
							authors: ["Frank Herbert"],
							description: "A desert planet sci-fi masterpiece.",
							pageCount: 412,
							imageLinks: {
								thumbnail: "http://books.google.com/books/content?id=dune&printsec=frontcover",
							},
							infoLink: "https://books.google.com/dune",
							industryIdentifiers: [{ type: "ISBN_13", identifier: "9780441172719" }],
						},
						saleInfo: {
							buyLink: "https://play.google.com/store/books/dune",
						},
					},
				],
			}),
		};

		const mockFetch = vi.fn().mockResolvedValue(mockResponse);
		const results = await fetchGoogleBooks("Dune", undefined, mockFetch as unknown as typeof fetch);

		expect(results).toHaveLength(1);
		const book = results[0];
		expect(book.id).toBe("g123");
		expect(book.title).toBe("Dune");
		expect(book.authors).toEqual(["Frank Herbert"]);
		expect(book.pageCount).toBe(412);
		expect(book.requiresManualPages).toBe(false);
		expect(book.coverUrl).toBe(
			"https://books.google.com/books/content?id=dune&printsec=frontcover",
		);
		expect(book.buyUrl).toBe("https://play.google.com/store/books/dune");
		expect(book.isbn).toBe("9780441172719");
		expect(book.sourceProvider).toBe("google_books");
	});

	it("flags requiresManualPages when Google volume lacks pageCount", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				totalItems: 1,
				items: [
					{
						id: "g456",
						volumeInfo: {
							title: "Obscure Indie Novel",
							authors: ["Indie Author"],
						},
					},
				],
			}),
		};

		const mockFetch = vi.fn().mockResolvedValue(mockResponse);
		const results = await fetchGoogleBooks(
			"Obscure",
			undefined,
			mockFetch as unknown as typeof fetch,
		);

		expect(results).toHaveLength(1);
		expect(results[0].pageCount).toBeNull();
		expect(results[0].requiresManualPages).toBe(true);
		expect(results[0].coverUrl).toBeNull();
	});
});

describe("fetchOpenLibrary", () => {
	it("normalizes Open Library doc payload and constructs cover URLs", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				numFound: 1,
				docs: [
					{
						key: "/works/OL12345W",
						title: "Neuromancer",
						author_name: ["William Gibson"],
						number_of_pages_median: 271,
						cover_i: 8234567,
						isbn: ["9780441569595"],
					},
				],
			}),
		};

		const mockFetch = vi.fn().mockResolvedValue(mockResponse);
		const results = await fetchOpenLibrary("Neuromancer", mockFetch as unknown as typeof fetch);

		expect(results).toHaveLength(1);
		const book = results[0];
		expect(book.id).toBe("OL12345W");
		expect(book.title).toBe("Neuromancer");
		expect(book.authors).toEqual(["William Gibson"]);
		expect(book.pageCount).toBe(271);
		expect(book.requiresManualPages).toBe(false);
		expect(book.coverUrl).toBe("https://covers.openlibrary.org/b/id/8234567-L.jpg");
		expect(book.isbn).toBe("9780441569595");
		expect(book.sourceProvider).toBe("open_library");
	});

	it("flags requiresManualPages when Open Library lacks page count", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				numFound: 1,
				docs: [
					{
						key: "/works/OL99999W",
						title: "Ancient Manuscript",
					},
				],
			}),
		};

		const mockFetch = vi.fn().mockResolvedValue(mockResponse);
		const results = await fetchOpenLibrary("Manuscript", mockFetch as unknown as typeof fetch);

		expect(results).toHaveLength(1);
		expect(results[0].pageCount).toBeNull();
		expect(results[0].requiresManualPages).toBe(true);
		expect(results[0].authors).toEqual(["Unknown Author"]);
	});
});

describe("searchBooks (Dual-Engine Fallback)", () => {
	it("returns Google Books results when Google query succeeds", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				totalItems: 1,
				items: [
					{
						id: "g1",
						volumeInfo: { title: "Hyperion", authors: ["Dan Simmons"], pageCount: 482 },
					},
				],
			}),
		});

		const response = await searchBooks("Hyperion", undefined, mockFetch as unknown as typeof fetch);

		expect(response.sourceProvider).toBe("google_books");
		expect(response.count).toBe(1);
		expect(response.results[0].title).toBe("Hyperion");
	});

	it("automatically falls back to Open Library when Google Books returns 0 results", async () => {
		const mockFetch = vi.fn().mockImplementation((url: string) => {
			if (url.includes("googleapis.com")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ totalItems: 0, items: [] }),
				});
			}
			return Promise.resolve({
				ok: true,
				json: async () => ({
					numFound: 1,
					docs: [
						{
							key: "/works/OL777W",
							title: "Foundation",
							author_name: ["Isaac Asimov"],
							number_of_pages_median: 255,
						},
					],
				}),
			});
		});

		const response = await searchBooks(
			"Foundation",
			undefined,
			mockFetch as unknown as typeof fetch,
		);

		expect(response.sourceProvider).toBe("open_library");
		expect(response.count).toBe(1);
		expect(response.results[0].title).toBe("Foundation");
		expect(response.results[0].authors).toEqual(["Isaac Asimov"]);
	});

	it("returns empty result if query length is less than minimum", async () => {
		const mockFetch = vi.fn();
		const response = await searchBooks("a", undefined, mockFetch as unknown as typeof fetch);

		expect(response.count).toBe(0);
		expect(response.results).toEqual([]);
		expect(mockFetch).not.toHaveBeenCalled();
	});
});
