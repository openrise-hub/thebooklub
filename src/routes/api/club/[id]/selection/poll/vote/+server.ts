import { getDb } from "$lib/server/db/index";
import { pollVotes, selectionPolls } from "$lib/server/db/schema";
import { type RequestHandler, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ error: "Authentication required to vote in book selection poll" },
			{ status: 401 },
		);
	}

	let body: {
		candidateId?: string;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	const candidateId = body.candidateId;
	if (!candidateId || typeof candidateId !== "string") {
		return json({ error: "Missing candidate ID" }, { status: 400 });
	}

	const db = await getDb();
	const activePoll = await db
		.select()
		.from(selectionPolls)
		.where(and(eq(selectionPolls.clubId, clubId), eq(selectionPolls.status, "active")))
		.limit(1);

	const now = Date.now();
	if (activePoll.length > 0) {
		const poll = activePoll[0];
		if (poll.expiresAt <= now) {
			return json({ error: "Poll has expired" }, { status: 400 });
		}

		// Check if user already voted
		const existingVote = await db
			.select()
			.from(pollVotes)
			.where(and(eq(pollVotes.pollId, poll.id), eq(pollVotes.userId, user.id)))
			.limit(1);

		if (existingVote.length > 0) {
			await db
				.update(pollVotes)
				.set({ candidateId, createdAt: now })
				.where(eq(pollVotes.id, existingVote[0].id));
		} else {
			await db.insert(pollVotes).values({
				id: `vote-${crypto.randomUUID().slice(0, 8)}`,
				pollId: poll.id,
				userId: user.id,
				candidateId,
				createdAt: now,
			});
		}
	}

	return json({
		success: true,
		clubId,
		votedCandidateId: candidateId,
		timestamp: new Date().toISOString(),
	});
};
