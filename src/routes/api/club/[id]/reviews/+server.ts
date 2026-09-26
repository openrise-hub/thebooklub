import { calculateAverageRating, validateReview } from "$lib/club/review";
import type { Review, ReviewPostRequest } from "$lib/types/review";
import { type RequestHandler, json } from "@sveltejs/kit";

const mockReviewsStore: Record<string, Review[]> = {
	"READ-4821": [
		{
			id: "rev-1",
			clubId: "READ-4821",
			cycleId: "cycle-1",
			userId: "user-alice",
			username: "AliceReader",
			avatarUrl: "https://gravatar.com/avatar/alice?d=identicon",
			rating: 4.5,
			comment: "Brilliant cyberpunk classic! The prose still holds up extraordinarily well.",
			createdAt: Date.now() - 3600000 * 24,
			updatedAt: Date.now() - 3600000 * 24,
		},
		{
			id: "rev-2",
			clubId: "READ-4821",
			cycleId: "cycle-1",
			userId: "user-bob",
			username: "BobBooks",
			avatarUrl: "https://gravatar.com/avatar/bob?d=identicon",
			rating: 4.0,
			comment: "Fascinating vision of the future with tight narrative momentum.",
			createdAt: Date.now() - 3600000 * 12,
			updatedAt: Date.now() - 3600000 * 12,
		},
	],
};

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

	const reviews = mockReviewsStore[clubId] ?? [];
	const averageRating = calculateAverageRating(reviews);

	return json({
		success: true,
		clubId,
		cycleId: "cycle-active",
		averageRating,
		totalReviews: reviews.length,
		reviews: [...reviews].sort((a, b) => b.createdAt - a.createdAt),
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

	const validation = validateReview(body.rating, body.comment);
	if (!validation.valid) {
		return json({ success: false, error: validation.error }, { status: 400 });
	}

	if (!mockReviewsStore[clubId]) {
		mockReviewsStore[clubId] = [];
	}

	const existingIndex = mockReviewsStore[clubId].findIndex(
		(r) => r.userId === user.id && r.cycleId === (body.cycleId || "cycle-active"),
	);

	const now = Date.now();
	let savedReview: Review;

	if (existingIndex >= 0) {
		const existing = mockReviewsStore[clubId][existingIndex];
		savedReview = {
			...existing,
			rating: body.rating,
			comment: body.comment?.trim() || undefined,
			criteria: body.criteria,
			updatedAt: now,
		};
		mockReviewsStore[clubId][existingIndex] = savedReview;
	} else {
		savedReview = {
			id: `rev-${crypto.randomUUID().slice(0, 8)}`,
			clubId,
			cycleId: body.cycleId || "cycle-active",
			userId: user.id,
			username: user.username,
			avatarUrl: user.avatarUrl,
			rating: body.rating,
			comment: body.comment?.trim() || undefined,
			criteria: body.criteria,
			createdAt: now,
			updatedAt: now,
		};
		mockReviewsStore[clubId].push(savedReview);
	}

	return json({
		success: true,
		review: savedReview,
	});
};
