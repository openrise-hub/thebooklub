import { validateInviteCode } from "$lib/club/validation";
import { ROUTES } from "$lib/constants/routes";
import { getDb } from "$lib/server/db/index";
import { clubMembers, clubs } from "$lib/server/db/schema";
import { type RequestHandler, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

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

	const db = await getDb();
	const targetClub = await db
		.select()
		.from(clubs)
		.where(eq(clubs.inviteCode, validation.normalized))
		.limit(1);

	const clubId = targetClub.length > 0 ? targetClub[0].id : validation.normalized;
	const now = Math.floor(Date.now() / 1000);

	if (targetClub.length > 0) {
		const existingMember = await db
			.select()
			.from(clubMembers)
			.where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, user.id)))
			.limit(1);

		if (existingMember.length === 0) {
			await db.insert(clubMembers).values({
				id: `mem-${crypto.randomUUID().slice(0, 8)}`,
				clubId,
				userId: user.id,
				role: "member",
				currentPage: 0,
				joinedAt: now,
			});
		}
	}

	return json({
		success: true,
		clubId: validation.normalized,
		role: "member",
		redirectUrl: ROUTES.CLUB_DASHBOARD(validation.normalized),
	});
};
