import { pickRandomWinnerIndex } from "$lib/club/roulette";
import { MAX_CANDIDATE_BOOKS, MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import { ROULETTE_SPIN_DURATION_MS } from "$lib/constants/selection";
import { type RequestHandler, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	if (!user) {
		return json({ error: "Authentication required to spin selection roulette" }, { status: 401 });
	}

	let body: {
		userRole?: "admin" | "member";
		candidates?: Array<{
			id: string;
			title: string;
			author: string;
			coverUrl?: string;
			totalPages: number;
		}>;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	if (body.userRole && body.userRole !== "admin") {
		return json({ error: "Only club administrators can spin selection roulette" }, { status: 403 });
	}

	const candidates = body.candidates || [];
	if (candidates.length < MIN_CANDIDATE_BOOKS) {
		return json(
			{ error: `Roulette requires at least ${MIN_CANDIDATE_BOOKS} candidate books.` },
			{ status: 400 },
		);
	}

	if (candidates.length > MAX_CANDIDATE_BOOKS) {
		return json(
			{ error: `Roulette cannot exceed ${MAX_CANDIDATE_BOOKS} candidate books.` },
			{ status: 400 },
		);
	}

	const winnerIndex = pickRandomWinnerIndex(candidates.length);
	const winner = candidates[winnerIndex];
	const seed = Math.floor(Math.random() * 1000000);

	return json({
		success: true,
		winnerIndex,
		winner,
		durationMs: ROULETTE_SPIN_DURATION_MS,
		seed,
	});
};
