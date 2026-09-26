import { CADENCE_TYPES, type CadenceType } from "$lib/constants/cadence";
import { type RequestHandler, json } from "@sveltejs/kit";

export interface CadenceUpdateBody {
	endDate: number;
	cadence?: CadenceType;
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json({ success: false, error: "Authentication required" }, { status: 401 });
	}

	let body: CadenceUpdateBody;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
	}

	if (!body.endDate || typeof body.endDate !== "number" || Number.isNaN(body.endDate)) {
		return json({ success: false, error: "Valid end date timestamp is required" }, { status: 400 });
	}

	const now = Date.now();
	if (body.endDate <= now) {
		return json(
			{ success: false, error: "Extended deadline must be in the future" },
			{ status: 400 },
		);
	}

	if (body.cadence && !CADENCE_TYPES.includes(body.cadence)) {
		return json({ success: false, error: "Invalid cadence type specified" }, { status: 400 });
	}

	return json({
		success: true,
		clubId,
		endDate: body.endDate,
		cadence: body.cadence ?? "custom",
		status: "active",
		purgeAborted: true,
		updatedAt: now,
	});
};
