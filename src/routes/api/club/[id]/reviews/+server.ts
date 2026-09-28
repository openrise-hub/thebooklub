import {
	calculateAverageRating,
	calculateCriteriaAverages,
	validateReview,
} from "$lib/club/review";
import { getDb } from "$lib/server/db/index";
import { reviews } from "$lib/server/db/schema";
import type { Review, ReviewPostRequest } from "$lib/types/review";
import { type RequestHandler, json } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to view club reviews" },
			{ status: 401 },
		);
	}

	const db = await getDb();
	const records = await db
		.select()
		.from(reviews)
		.where(eq(reviews.clubId, clubId))
		.orderBy(desc(reviews.createdAt));

	const formattedReviews: Review[] = records.map((r) => ({
		id: r.id,
		clubId: r.clubId,
		cycleId: r.cycleId,
		userId: r.userId,
		username: r.username,
		avatarUrl: r.avatarUrl,
		rating: r.rating,
		comment: r.comment ?? undefined,
		criteria: r.criteria ? JSON.parse(r.criteria) : undefined,
		createdAt: r.createdAt,
		updatedAt: r.createdAt,
	}));

	const averageRating = calculateAverageRating(formattedReviews);
	const criteriaAverages = calculateCriteriaAverages(formattedReviews);

	return json({
		success: true,
		clubId,
		cycleId: "cycle-active",
		averageRating,
		criteriaAverages,
		totalReviews: formattedReviews.length,
		reviews: formattedReviews,
	});
};

async function upsertReview(
	db: Awaited<ReturnType<typeof getDb>>,
	clubId: string,
	cycleId: string,
	user: NonNullable<Parameters<RequestHandler>[0]["locals"]["user"]>,
	body: ReviewPostRequest,
	now: number,
): Promise<Review> {
	const existing = await db
		.select()
		.from(reviews)
		.where(
			and(eq(reviews.clubId, clubId), eq(reviews.userId, user.id), eq(reviews.cycleId, cycleId)),
		)
		.limit(1);

	if (existing.length > 0) {
		const rec = existing[0];
		await db
			.update(reviews)
			.set({
				rating: body.rating,
				comment: body.comment?.trim() || null,
				criteria: body.criteria ? JSON.stringify(body.criteria) : null,
			})
			.where(eq(reviews.id, rec.id));

		return {
			id: rec.id,
			clubId,
			cycleId,
			userId: user.id,
			username: user.username,
			avatarUrl: user.avatarUrl,
			rating: body.rating,
			comment: body.comment?.trim() || undefined,
			criteria: body.criteria,
			createdAt: rec.createdAt,
			updatedAt: now,
		};
	}

	const revId = `rev-${crypto.randomUUID().slice(0, 8)}`;
	await db.insert(reviews).values({
		id: revId,
		clubId,
		cycleId,
		userId: user.id,
		username: user.username,
		avatarUrl: user.avatarUrl,
		rating: body.rating,
		comment: body.comment?.trim() || null,
		criteria: body.criteria ? JSON.stringify(body.criteria) : null,
		createdAt: now,
	});

	return {
		id: revId,
		clubId,
		cycleId,
		userId: user.id,
		username: user.username,
		avatarUrl: user.avatarUrl,
		rating: body.rating,
		comment: body.comment?.trim() || undefined,
		criteria: body.criteria,
		createdAt: now,
		updatedAt: now,
	};
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to submit reviews" },
			{ status: 401 },
		);
	}

	let body: ReviewPostRequest;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
	}

	const validation = validateReview(body.rating, body.comment, body.criteria);
	if (!validation.valid) {
		return json({ success: false, error: validation.error }, { status: 400 });
	}

	const db = await getDb();
	const cycleId = body.cycleId || "cycle-active";
	const now = Date.now();

	const savedReview = await upsertReview(db, clubId, cycleId, user, body, now);

	return json({
		success: true,
		review: savedReview,
	});
};
