export type BookSourceProvider = "google_books" | "open_library";

export interface NormalizedBook {
	id: string;
	title: string;
	authors: string[];
	description?: string;
	pageCount: number | null;
	requiresManualPages: boolean;
	coverUrl: string | null;
	infoUrl?: string;
	buyUrl?: string;
	isbn?: string;
	sourceProvider: BookSourceProvider;
}

export interface BookSearchResponse {
	query: string;
	count: number;
	sourceProvider: BookSourceProvider;
	results: NormalizedBook[];
}
