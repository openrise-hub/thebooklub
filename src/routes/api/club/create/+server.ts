import { generateInviteCode } from "$lib/club/generator";
import { type CadenceType, CADENCE_TYPES } from "$lib/constants/cadence";
import { CLUB_NAME_MAX_LENGTH, CLUB_NAME_MIN_LENGTH } from "$lib/constants/club";
import { ROUTES } from "$lib/constants/routes";
import { type RequestHandler, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	if (!user.isEmailVerified) {
		return json(
			{ success: false, error: "Email verification required to create clubs" },
			{ status: 403 },
		);
	}

	let body: {
		name?: string;
		cadence?: CadenceType;
		advancedReviews?: boolean;
	};

	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
	}

	const name = (body.name || "").trim();
	if (name.length < CLUB_NAME_MIN_LENGTH || name.length > CLUB_NAME_MAX_LENGTH) {
		return json(
			{
				success: false,
				error: `Club name must be between ${CLUB_NAME_MIN_LENGTH} and ${CLUB_NAME_MAX_LENGTH} characters`,
			},
			{ status: 400 },
		);
	}

	const cadence = body.cadence;
	if (!cadence || !CADENCE_TYPES.includes(cadence)) {
		return json({ success: false, error: "Invalid reading cadence" }, { status: 400 });
	}

	const advancedReviews = Boolean(body.advancedReviews);
	const inviteCode = generateInviteCode();

	return json({
		success: true,
		clubId: inviteCode,
		inviteCode,
		name,
		cadence,
		advancedReviews,
		role: "admin",
		redirectUrl: ROUTES.CLUB_DASHBOARD(inviteCode),
	});
};
