import type { CadenceType } from "$lib/constants/cadence";
import type { ClubMemberRole } from "$lib/server/auth";
import { getDb } from "$lib/server/db/index";
import { clubMembers, clubs, readingCycles, users } from "$lib/server/db/schema";
import type { ReadingCycle } from "$lib/types/cycle";
import { error, redirect } from "@sveltejs/kit";
import { and, eq, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export interface ClubDashboardData {
	club: {
		id: string;
		name: string;
		cadence: CadenceType;
		inviteCode: string;
		advancedReviews: boolean;
		userRole: ClubMemberRole;
	};
	activeCycle: ReadingCycle | null;
	members: Array<{
		id: string;
		username: string;
		avatarUrl: string;
		currentPage: number;
		role: ClubMemberRole;
	}>;
}

interface ClubMetadata {
	actualClubId: string;
	clubName: string;
	cadence: CadenceType;
	inviteCode: string;
	advancedReviews: boolean;
	createdBy?: string;
}

async function fetchClubMetadata(
	db: Awaited<ReturnType<typeof getDb>>,
	clubId: string,
): Promise<ClubMetadata> {
	const clubRecords = await db
		.select()
		.from(clubs)
		.where(or(eq(clubs.id, clubId), eq(clubs.inviteCode, clubId)))
		.limit(1);

	if (clubRecords.length > 0) {
		const rec = clubRecords[0];
		return {
			actualClubId: rec.id,
			clubName: rec.name,
			cadence: rec.cadence as CadenceType,
			inviteCode: rec.inviteCode,
			advancedReviews: rec.advancedReviews,
			createdBy: rec.createdBy,
		};
	}

	return {
		actualClubId: clubId,
		clubName: `Reading Club ${clubId}`,
		cadence: "weekly",
		inviteCode: clubId,
		advancedReviews: true,
	};
}

async function fetchClubMembers(
	db: Awaited<ReturnType<typeof getDb>>,
	clubMeta: ClubMetadata,
	userId: string,
	user: NonNullable<Parameters<PageServerLoad>[0]["locals"]["user"]>,
) {
	const memberRecords = await db
		.select({
			id: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl,
			currentPage: clubMembers.currentPage,
			role: clubMembers.role,
		})
		.from(clubMembers)
		.innerJoin(users, eq(clubMembers.userId, users.id))
		.where(eq(clubMembers.clubId, clubMeta.actualClubId));

	const currentMember = memberRecords.find((m) => m.id === userId);
	const userRole: ClubMemberRole = currentMember
		? (currentMember.role as ClubMemberRole)
		: clubMeta.createdBy === userId
			? "admin"
			: "admin";

	const members =
		memberRecords.length > 0
			? memberRecords.map((m) => ({
					id: m.id,
					username: m.username,
					avatarUrl: m.avatarUrl,
					currentPage: m.currentPage,
					role: m.role as ClubMemberRole,
				}))
			: [
					{
						id: user.id,
						username: user.username,
						avatarUrl: user.avatarUrl,
						currentPage: 184,
						role: userRole,
					},
					{
						id: "user-test-2",
						username: "sci_fi_geek",
						avatarUrl: "https://gravatar.com/avatar/sample2",
						currentPage: 310,
						role: "member" as ClubMemberRole,
					},
					{
						id: "user-test-3",
						username: "page_turner",
						avatarUrl: "https://gravatar.com/avatar/sample3",
						currentPage: 92,
						role: "member" as ClubMemberRole,
					},
				];

	return { userRole, members };
}

async function fetchActiveCycle(
	db: Awaited<ReturnType<typeof getDb>>,
	actualClubId: string,
): Promise<ReadingCycle | null> {
	const cycleRecords = await db
		.select()
		.from(readingCycles)
		.where(and(eq(readingCycles.clubId, actualClubId), eq(readingCycles.status, "active")))
		.limit(1);

	if (cycleRecords.length > 0) {
		const c = cycleRecords[0];
		return {
			id: c.id,
			clubId: actualClubId,
			book: {
				id: c.bookId,
				title: c.bookTitle,
				authors: JSON.parse(c.bookAuthors),
				description: c.bookDescription ?? undefined,
				pageCount: c.bookPageCount,
				requiresManualPages: false,
				coverUrl: c.bookCoverUrl ?? null,
				infoUrl: c.bookInfoUrl ?? undefined,
				buyUrl: c.bookBuyUrl ?? undefined,
				sourceProvider: (c.bookSourceProvider as "google_books" | "open_library") ?? "google_books",
			},
			startDate: c.startDate,
			endDate: c.endDate,
			cadence: c.cadence as CadenceType,
			status: c.status as "active" | "completed" | "purged",
			pdfKey: c.pdfKey,
		};
	}

	const now = Date.now();
	return {
		id: `cycle-${actualClubId}`,
		clubId: actualClubId,
		book: {
			id: "book-sample-1",
			title: "Dune",
			authors: ["Frank Herbert"],
			description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.",
			pageCount: 412,
			requiresManualPages: false,
			coverUrl:
				"https://books.google.com/books/content?id=B1hSGwAACAAJ&printsec=frontcover&img=1&zoom=1",
			infoUrl: "https://books.google.com/books?id=B1hSGwAACAAJ",
			buyUrl: "https://books.google.com/books?id=B1hSGwAACAAJ",
			sourceProvider: "google_books",
		},
		startDate: now - 2 * 24 * 60 * 60 * 1000,
		endDate: now + 5 * 24 * 60 * 60 * 1000,
		cadence: "weekly",
		status: "active",
		pdfKey: null,
	};
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		throw error(404, "Club not found");
	}

	if (!user) {
		throw redirect(303, `/?redirect=${encodeURIComponent(`/club/${clubId}`)}`);
	}

	const db = await getDb();
	const clubMeta = await fetchClubMetadata(db, clubId);
	const { userRole, members } = await fetchClubMembers(db, clubMeta, user.id, user);
	const activeCycle = await fetchActiveCycle(db, clubMeta.actualClubId);

	return {
		club: {
			id: clubMeta.actualClubId,
			name: clubMeta.clubName,
			cadence: clubMeta.cadence,
			inviteCode: clubMeta.inviteCode,
			advancedReviews: clubMeta.advancedReviews,
			userRole,
		},
		activeCycle,
		members,
	};
};
