import { MIN_SEARCH_QUERY_LENGTH } from "$lib/constants/books";
import type { BookSearchResponse } from "$lib/types/book";
import { fetchGoogleBooks } from "./google";
import { fetchOpenLibrary } from "./openlibrary";

export async function searchBooks(
	query: string,
	apiKey?: string,
	customFetch: typeof fetch = fetch,
): Promise<BookSearchResponse> {
	const trimmed = query.trim();

	if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
		return {
			query: trimmed,
			count: 0,
			sourceProvider: "google_books",
			results: [],
		};
	}

	const googleResults = await fetchGoogleBooks(trimmed, apiKey, customFetch);

	if (googleResults.length > 0) {
		return {
			query: trimmed,
			count: googleResults.length,
			sourceProvider: "google_books",
			results: googleResults,
		};
	}

	const openLibraryResults = await fetchOpenLibrary(trimmed, customFetch);

	return {
		query: trimmed,
		count: openLibraryResults.length,
		sourceProvider: "open_library",
		results: openLibraryResults,
	};
}
