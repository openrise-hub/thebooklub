import { createCandidateBook, validateCandidateCount } from "$lib/club/selection";
import {
	DEFAULT_POLL_HOURS,
	DEFAULT_SELECTION_MODE,
	type SelectionMode,
} from "$lib/constants/selection";
import { getDb } from "$lib/server/db/index";
import { selectionNominations, selectionPolls } from "$lib/server/db/schema";
import { type RequestHandler, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ params }) => {
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	const db = await getDb();
	const nominations = await db
		.select()
		.from(selectionNominations)
		.where(eq(selectionNominations.clubId, clubId));

	const activePoll = await db
		.select()
		.from(selectionPolls)
		.where(eq(selectionPolls.clubId, clubId))
		.limit(1);

	const candidates = nominations.map((n) => JSON.parse(n.bookData));

	return json({
		clubId,
		session:
			activePoll.length > 0
				? {
						id: activePoll[0].id,
						clubId,
						mode: "poll",
						status: activePoll[0].status,
						candidates,
						pollEndsAt: new Date(activePoll[0].expiresAt).toISOString(),
						createdAt: new Date(activePoll[0].createdAt).toISOString(),
					}
				: null,
	});
};

async function saveSelectionCandidates(
	db: Awaited<ReturnType<typeof getDb>>,
	clubId: string,
	userId: string,
	candidates: ReturnType<typeof createCandidateBook>[],
	now: number,
): Promise<void> {
	await db.delete(selectionNominations).where(eq(selectionNominations.clubId, clubId));
	for (let i = 0; i < candidates.length; i++) {
		await db.insert(selectionNominations).values({
			id: `nom-${crypto.randomUUID().slice(0, 8)}`,
			clubId,
			bookData: JSON.stringify(candidates[i]),
			colorIndex: i,
			nominatedBy: userId,
			createdAt: now,
		});
	}
}

async function savePollSession(
	db: Awaited<ReturnType<typeof getDb>>,
	sessionId: string,
	clubId: string,
	pollEndsAt: number,
	now: number,
): Promise<void> {
	await db.delete(selectionPolls).where(eq(selectionPolls.clubId, clubId));
	await db.insert(selectionPolls).values({
		id: sessionId,
		clubId,
		status: "active",
		expiresAt: pollEndsAt,
		createdAt: now,
	});
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	if (!user) {
		return json({ error: "Authentication required to configure book selection" }, { status: 401 });
	}

	let body: {
		mode?: SelectionMode;
		userRole?: "admin" | "member";
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

	if (body.userRole && body.userRole !== "admin") {
		return json(
			{ error: "Only club administrators can configure book selection" },
			{ status: 403 },
		);
	}

	const rawCandidates = body.candidates || [];
	const validation = validateCandidateCount(rawCandidates.length);
	if (!validation.valid) {
		return json({ error: validation.error }, { status: 400 });
	}

	const mode = body.mode === "poll" ? "poll" : DEFAULT_SELECTION_MODE;
	const candidates = rawCandidates.map((c, idx) => createCandidateBook(c, idx));
	const pollDurationHours = Math.max(1, body.pollDurationHours || DEFAULT_POLL_HOURS);

	const now = Date.now();
	const pollEndsAt = now + pollDurationHours * 60 * 60 * 1000;
	const sessionId = `selection-${now}`;

	const db = await getDb();
	await saveSelectionCandidates(db, clubId, user.id, candidates, now);

	if (mode === "poll") {
		await savePollSession(db, sessionId, clubId, pollEndsAt, now);
	}

	const session = {
		id: sessionId,
		clubId,
		mode,
		status: "active",
		candidates,
		pollDurationHours: mode === "poll" ? pollDurationHours : undefined,
		pollEndsAt: mode === "poll" ? new Date(pollEndsAt).toISOString() : undefined,
		seed: Math.floor(Math.random() * 1000000),
		createdAt: new Date(now).toISOString(),
	};

	return json({
		success: true,
		session,
	});
};
