import { validateDiscussionMessage } from "$lib/club/discussion";
import { getDb } from "$lib/server/db/index";
import { discussions } from "$lib/server/db/schema";
import type { DiscussionMessage, DiscussionPostRequest } from "$lib/types/discussion";
import { type RequestHandler, json } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to view club discussions" },
			{ status: 401 },
		);
	}

	const db = await getDb();
	const records = await db
		.select()
		.from(discussions)
		.where(eq(discussions.clubId, clubId))
		.orderBy(asc(discussions.createdAt));

	const messages: DiscussionMessage[] = records.map((r) => ({
		id: r.id,
		clubId: r.clubId,
		cycleId: r.cycleId,
		userId: r.userId,
		username: r.username,
		avatarUrl: r.avatarUrl,
		content: r.content,
		pageReference: r.pageReference,
		createdAt: r.createdAt,
	}));

	return json({
		success: true,
		clubId,
		messages,
	});
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to post messages" },
			{ status: 401 },
		);
	}

	let body: DiscussionPostRequest;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
	}

	const validation = validateDiscussionMessage(body.content, body.pageReference, 10000);
	if (!validation.valid) {
		return json({ success: false, error: validation.error }, { status: 400 });
	}

	const db = await getDb();
	const msgId = `msg-${crypto.randomUUID().slice(0, 8)}`;
	const now = Date.now();
	const cycleId = body.cycleId || "cycle-active";

	const newMessage: DiscussionMessage = {
		id: msgId,
		clubId,
		cycleId,
		userId: user.id,
		username: user.username,
		avatarUrl: user.avatarUrl,
		content: body.content.trim(),
		pageReference: Math.floor(body.pageReference),
		createdAt: now,
	};

	await db.insert(discussions).values({
		id: msgId,
		clubId,
		cycleId,
		userId: user.id,
		username: user.username,
		avatarUrl: user.avatarUrl,
		content: body.content.trim(),
		pageReference: Math.floor(body.pageReference),
		createdAt: now,
	});

	return json({
		success: true,
		message: newMessage,
	});
};
