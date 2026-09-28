import { calculateProgressPercent } from "$lib/club/progress";
import { getDb } from "$lib/server/db/index";
import { clubMembers, readingCycles } from "$lib/server/db/schema";
import { type RequestHandler, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export interface ProgressRequestBody {
	currentPage: number;
	totalPages: number;
}

interface ProgressValidationResult {
	valid: boolean;
	error?: string;
}

function validateProgressBounds(currentPage: number, totalPages: number): ProgressValidationResult {
	if (
		typeof currentPage !== "number" ||
		Number.isNaN(currentPage) ||
		!Number.isFinite(currentPage)
	) {
		return { valid: false, error: "Current page must be a valid number" };
	}

	if (currentPage < 0) {
		return { valid: false, error: "Current page cannot be negative" };
	}

	if (typeof totalPages === "number" && totalPages > 0) {
		if (currentPage > totalPages) {
			return {
				valid: false,
				error: `Current page (${currentPage}) cannot exceed total pages (${totalPages})`,
			};
		}
	}

	return { valid: true };
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to update reading progress" },
			{ status: 401 },
		);
	}

	let body: ProgressRequestBody;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
	}

	const validation = validateProgressBounds(body.currentPage, body.totalPages);
	if (!validation.valid) {
		return json({ success: false, error: validation.error }, { status: 400 });
	}

	const total = body.totalPages > 0 ? body.totalPages : 1;
	const pageVal = Math.floor(body.currentPage);
	const percent = calculateProgressPercent(pageVal, total);
	const now = Date.now();

	const db = await getDb();
	await db
		.update(clubMembers)
		.set({ currentPage: pageVal })
		.where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id)));

	return json({
		success: true,
		clubId,
		userId: user.id,
		currentPage: pageVal,
		totalPages: Math.floor(total),
		percent,
		updatedAt: now,
	});
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to view reading progress" },
			{ status: 401 },
		);
	}

	const db = await getDb();
	const member = await db
		.select()
		.from(clubMembers)
		.where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id)))
		.limit(1);

	const activeCycle = await db
		.select()
		.from(readingCycles)
		.where(and(eq(readingCycles.clubId, clubId), eq(readingCycles.status, "active")))
		.limit(1);

	const currentPage = member.length > 0 ? member[0].currentPage : 0;
	const totalPages = activeCycle.length > 0 ? activeCycle[0].bookPageCount : 100;
	const percent = calculateProgressPercent(currentPage, totalPages);

	return json({
		success: true,
		clubId,
		userId: user.id,
		currentPage,
		totalPages,
		percent,
		updatedAt: Date.now(),
	});
};
