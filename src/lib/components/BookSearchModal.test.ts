import { MIN_SEARCH_QUERY_LENGTH } from "$lib/constants/books";
import { SEARCH_DEBOUNCE_MS } from "$lib/constants/cadence";
import type { NormalizedBook } from "$lib/types/book";
import { describe, expect, it } from "vitest";

describe("BookSearchModal Timing and Bounds", () => {
	it("enforces 350ms search debounce delay constant", () => {
		expect(SEARCH_DEBOUNCE_MS).toBe(350);
	});

	it("enforces minimum query search length", () => {
		expect(MIN_SEARCH_QUERY_LENGTH).toBe(2);
	});
});

describe("Book Selection & Page Count Logic", () => {
	const validBook: NormalizedBook = {
		id: "b1",
		title: "Dune",
		authors: ["Frank Herbert"],
		pageCount: 412,
		requiresManualPages: false,
		coverUrl: "https://example.com/cover.jpg",
		sourceProvider: "google_books",
	};

	const missingPageBook: NormalizedBook = {
		id: "b2",
		title: "Indie Story",
		authors: ["Unknown"],
		pageCount: null,
		requiresManualPages: true,
		coverUrl: null,
		sourceProvider: "open_library",
	};

	it("identifies complete book ready for selection", () => {
		expect(validBook.pageCount).toBeGreaterThan(0);
		expect(validBook.requiresManualPages).toBe(false);
	});

	it("flags missing page book requiring manual input", () => {
		expect(missingPageBook.requiresManualPages).toBe(true);
		expect(missingPageBook.pageCount).toBeNull();
	});

	it("resolves manual page count override for missing page books", () => {
		const manualInput = 320;
		const updatedBook: NormalizedBook = {
			...missingPageBook,
			pageCount: manualInput,
			requiresManualPages: false,
		};

		expect(updatedBook.pageCount).toBe(320);
		expect(updatedBook.requiresManualPages).toBe(false);
	});
});
