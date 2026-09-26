import { DEFAULT_SEARCH_RESULTS_LIMIT, GOOGLE_BOOKS_API_URL } from "$lib/constants/books";
import type { NormalizedBook } from "$lib/types/book";

interface GoogleVolumeInfo {
	title?: string;
	authors?: string[];
	description?: string;
	pageCount?: number;
	imageLinks?: {
		thumbnail?: string;
		smallThumbnail?: string;
	};
	infoLink?: string;
	industryIdentifiers?: Array<{
		type: string;
		identifier: string;
	}>;
}

interface GoogleVolumeItem {
	id: string;
	volumeInfo?: GoogleVolumeInfo;
	saleInfo?: {
		buyLink?: string;
	};
}

interface GoogleBooksApiResponse {
	totalItems?: number;
	items?: GoogleVolumeItem[];
}

export async function fetchGoogleBooks(
	query: string,
	apiKey?: string,
	customFetch: typeof fetch = fetch,
): Promise<NormalizedBook[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const params = new URLSearchParams({
		q: trimmed,
		maxResults: String(DEFAULT_SEARCH_RESULTS_LIMIT),
		printType: "books",
	});

	if (apiKey) {
		params.set("key", apiKey);
	}

	try {
		const res = await customFetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);
		if (!res.ok) return [];

		const data: GoogleBooksApiResponse = await res.json();
		if (!data.items || data.items.length === 0) return [];

		return data.items.map((item) => {
			const info = item.volumeInfo || {};
			const pageCount = info.pageCount && info.pageCount > 0 ? info.pageCount : null;
			const rawCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
			const coverUrl = rawCover ? rawCover.replace(/^http:\/\//i, "https://") : null;
			const isbn = info.industryIdentifiers?.find((id) => id.type.includes("ISBN"))?.identifier;

			return {
				id: item.id,
				title: info.title || "Untitled",
				authors: info.authors && info.authors.length > 0 ? info.authors : ["Unknown Author"],
				description: info.description,
				pageCount,
				requiresManualPages: pageCount === null,
				coverUrl,
				infoUrl: info.infoLink,
				buyUrl: item.saleInfo?.buyLink || info.infoLink,
				isbn,
				sourceProvider: "google_books",
			};
		});
	} catch {
		return [];
	}
}
