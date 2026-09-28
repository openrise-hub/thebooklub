import { getDb } from "$lib/server/db/index";
import { clubMembers, clubs, selectionNominations } from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import { and, eq, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	if (!clubId) {
		throw error(404, "Club not found");
	}

	if (!user) {
		throw redirect(303, `/?redirect=${encodeURIComponent(`/club/${clubId}/select`)}`);
	}

	const db = await getDb();
	const clubRecords = await db
		.select()
		.from(clubs)
		.where(or(eq(clubs.id, clubId), eq(clubs.inviteCode, clubId)))
		.limit(1);

	let clubName = "The Book Club";
	let inviteCode = clubId;
	let actualClubId = clubId;
	let isAdmin = false;

	if (clubRecords.length > 0) {
		const rec = clubRecords[0];
		clubName = rec.name;
		inviteCode = rec.inviteCode;
		actualClubId = rec.id;
		isAdmin = rec.createdBy === user.id || user.userType === 42;
	}

	const memberRecord = await db
		.select()
		.from(clubMembers)
		.where(and(eq(clubMembers.clubId, actualClubId), eq(clubMembers.userId, user.id)))
		.limit(1);

	if (memberRecord.length > 0 && memberRecord[0].role === "admin") {
		isAdmin = true;
	}

	const nominations = await db
		.select()
		.from(selectionNominations)
		.where(eq(selectionNominations.clubId, actualClubId));

	const candidates = nominations.map((n) => JSON.parse(n.bookData));

	return {
		clubId: actualClubId,
		club: {
			id: actualClubId,
			name: clubName,
			inviteCode,
			isAdmin,
		},
		candidates,
	};
};
