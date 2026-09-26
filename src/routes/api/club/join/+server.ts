import { validateInviteCode } from "$lib/club/validation";
import { ROUTES } from "$lib/constants/routes";
import { type RequestHandler, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	if (!user.isEmailVerified) {
		return json(
			{ success: false, error: "Email verification required before joining clubs" },
			{ status: 403 },
		);
	}

	let body: { code?: string };
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
	}

	const code = body.code || "";
	const validation = validateInviteCode(code);

	if (!validation.valid) {
		return json(
			{ success: false, error: validation.error || "Invalid invite code format" },
			{ status: 400 },
		);
	}

	return json({
		success: true,
		clubId: validation.normalized,
		role: "member",
		redirectUrl: ROUTES.CLUB_DASHBOARD(validation.normalized),
	});
};
