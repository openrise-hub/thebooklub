import { calculateProgressPercent } from "$lib/club/progress";
import { type RequestHandler, json } from "@sveltejs/kit";

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
	const percent = calculateProgressPercent(body.currentPage, total);
	const now = Date.now();

	return json({
		success: true,
		clubId,
		userId: user.id,
		currentPage: Math.floor(body.currentPage),
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

	return json({
		success: true,
		clubId,
		userId: user.id,
		currentPage: 184,
		totalPages: 412,
		percent: 45,
		updatedAt: Date.now(),
	});
};
