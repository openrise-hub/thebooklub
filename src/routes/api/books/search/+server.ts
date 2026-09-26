import { env } from "$env/dynamic/private";
import { MIN_SEARCH_QUERY_LENGTH } from "$lib/constants/books";
import { searchBooks } from "$lib/server/books/search";
import { type RequestHandler, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, fetch: customFetch }) => {
	const query = url.searchParams.get("q") || "";
	const trimmed = query.trim();

	if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
		return json(
			{
				error: `Query parameter 'q' must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`,
			},
			{ status: 400 },
		);
	}

	const response = await searchBooks(trimmed, env.GOOGLE_BOOKS_API_KEY, customFetch);

	return json(response);
};
