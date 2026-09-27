import { createCandidateBook, validateCandidateCount } from "$lib/club/selection";
import {
	DEFAULT_POLL_HOURS,
	DEFAULT_SELECTION_MODE,
	type SelectionMode,
} from "$lib/constants/selection";
import { type RequestHandler, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	return json({
		clubId,
		session: null,
	});
};

export const POST: RequestHandler = async ({ params, request }) => {
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	let body: {
		mode?: SelectionMode;
		candidates?: Array<{
			id?: string;
			title: string;
			author: string;
			coverUrl?: string;
			totalPages?: number;
		}>;
		pollDurationHours?: number;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	const rawCandidates = body.candidates || [];
	const validation = validateCandidateCount(rawCandidates.length);
	if (!validation.valid) {
		return json({ error: validation.error }, { status: 400 });
	}

	const mode = body.mode === "poll" ? "poll" : DEFAULT_SELECTION_MODE;
	const candidates = rawCandidates.map((c, idx) => createCandidateBook(c, idx));
	const pollDurationHours = Math.max(1, body.pollDurationHours || DEFAULT_POLL_HOURS);

	const now = new Date();
	const pollEndsAt =
		mode === "poll"
			? new Date(now.getTime() + pollDurationHours * 60 * 60 * 1000).toISOString()
			: undefined;

	const session = {
		id: `selection-${Date.now()}`,
		clubId,
		mode,
		status: "active",
		candidates,
		pollDurationHours: mode === "poll" ? pollDurationHours : undefined,
		pollEndsAt,
		seed: Math.floor(Math.random() * 1000000),
		createdAt: now.toISOString(),
	};

	return json({
		success: true,
		session,
	});
};
