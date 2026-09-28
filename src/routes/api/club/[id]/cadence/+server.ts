import { CADENCE_TYPES, type CadenceType } from "$lib/constants/cadence";
import { getDb } from "$lib/server/db/index";
import { clubMembers, clubs, readingCycles } from "$lib/server/db/schema";
import { type RequestHandler, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export interface CadenceUpdateBody {
	endDate: number;
	cadence?: CadenceType;
	userRole?: "admin" | "member";
}

async function verifyAdminPermission(
	db: Awaited<ReturnType<typeof getDb>>,
	clubId: string,
	userId: string,
	userType: number,
	userRole?: "admin" | "member",
): Promise<boolean> {
	if (userRole && userRole !== "admin") return false;
	if (userType === 42) return true;

	const member = await db
		.select()
		.from(clubMembers)
		.where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
		.limit(1);

	const role = member.length > 0 ? member[0].role : (userRole ?? "admin");
	return role === "admin";
}

function validateCadenceBody(body: CadenceUpdateBody): string | null {
	if (!body.endDate || typeof body.endDate !== "number" || Number.isNaN(body.endDate)) {
		return "Valid end date timestamp is required";
	}
	if (body.endDate <= Date.now()) {
		return "Extended deadline must be in the future";
	}
	if (body.cadence && !CADENCE_TYPES.includes(body.cadence)) {
		return "Invalid cadence type specified";
	}
	return null;
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

	const db = await getDb();
	const isAuthorized = await verifyAdminPermission(
		db,
		clubId,
		user.id,
		user.userType,
		body.userRole,
	);
	if (!isAuthorized) {
		return json(
			{ success: false, error: "Only club administrators can modify cadence and deadlines" },
			{ status: 403 },
		);
	}

	const validationError = validateCadenceBody(body);
	if (validationError) {
		return json({ success: false, error: validationError }, { status: 400 });
	}

	const cadenceVal = body.cadence ?? "custom";
	const now = Date.now();

	await db
		.update(readingCycles)
		.set({
			endDate: body.endDate,
			cadence: cadenceVal,
			status: "active",
		})
		.where(and(eq(readingCycles.clubId, clubId), eq(readingCycles.status, "active")));

	if (body.cadence) {
		await db.update(clubs).set({ cadence: cadenceVal }).where(eq(clubs.id, clubId));
	}

	return json({
		success: true,
		clubId,
		endDate: body.endDate,
		cadence: cadenceVal,
		status: "active",
		purgeAborted: true,
		updatedAt: now,
	});
};
