import {
	DEFAULT_SEARCH_RESULTS_LIMIT,
	OPEN_LIBRARY_COVER_BASE_URL,
	OPEN_LIBRARY_SEARCH_URL,
} from "$lib/constants/books";
import type { NormalizedBook } from "$lib/types/book";

interface OpenLibraryDoc {
	key: string;
	title?: string;
	author_name?: string[];
	number_of_pages_median?: number;
	cover_i?: number;
	isbn?: string[];
	first_publish_year?: number;
}

interface OpenLibraryApiResponse {
	numFound?: number;
	docs?: OpenLibraryDoc[];
}

export async function fetchOpenLibrary(
	query: string,
	customFetch: typeof fetch = fetch,
): Promise<NormalizedBook[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const params = new URLSearchParams({
		q: trimmed,
		limit: String(DEFAULT_SEARCH_RESULTS_LIMIT),
	});

	try {
		const res = await customFetch(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`);
		if (!res.ok) return [];

		const data: OpenLibraryApiResponse = await res.json();
		if (!data.docs || data.docs.length === 0) return [];

		return data.docs.map((doc) => {
			const pageCount =
				doc.number_of_pages_median && doc.number_of_pages_median > 0
					? doc.number_of_pages_median
					: null;
			const coverUrl = doc.cover_i ? `${OPEN_LIBRARY_COVER_BASE_URL}/${doc.cover_i}-L.jpg` : null;
			const cleanId = doc.key.replace(/^\/works\//, "");

			return {
				id: cleanId,
				title: doc.title || "Untitled",
				authors: doc.author_name && doc.author_name.length > 0 ? doc.author_name : ["Unknown Author"],
				description: undefined,
				pageCount,
				requiresManualPages: pageCount === null,
				coverUrl,
				infoUrl: `https://openlibrary.org${doc.key}`,
				buyUrl: undefined,
				isbn: doc.isbn?.[0],
				sourceProvider: "open_library",
			};
		});
	} catch {
		return [];
	}
}
