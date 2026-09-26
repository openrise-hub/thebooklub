import type { CadenceType } from "$lib/constants/cadence";
import type { ClubMemberRole } from "$lib/server/auth";
import type { ReadingCycle } from "$lib/types/cycle";
import { error, redirect } from "@sveltejs/kit";
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

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		throw error(404, "Club not found");
	}

	if (!user) {
		throw redirect(303, `/?redirect=${encodeURIComponent(`/club/${clubId}`)}`);
	}

	const now = Date.now();
	const startDate = now - 2 * 24 * 60 * 60 * 1000;
	const endDate = now + 5 * 24 * 60 * 60 * 1000;

	const activeCycle: ReadingCycle = {
		id: `cycle-${clubId}`,
		clubId,
		book: {
			id: "book-sample-1",
			title: "Dune",
			authors: ["Frank Herbert"],
			description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.",
			pageCount: 412,
			requiresManualPages: false,
			coverUrl: "https://books.google.com/books/content?id=B1hSGwAACAAJ&printsec=frontcover&img=1&zoom=1",
			infoUrl: "https://books.google.com/books?id=B1hSGwAACAAJ",
			buyUrl: "https://books.google.com/books?id=B1hSGwAACAAJ",
			sourceProvider: "google_books",
		},
		startDate,
		endDate,
		cadence: "weekly",
		status: "active",
		pdfKey: null,
	};

	const members = [
		{
			id: user.id,
			username: user.username,
			avatarUrl: user.avatarUrl,
			currentPage: 184,
			role: "admin" as ClubMemberRole,
		},
		{
			id: "member-2",
			username: "cosmic_reader",
			avatarUrl: "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?d=retro&s=120",
			currentPage: 310,
			role: "member" as ClubMemberRole,
		},
		{
			id: "member-3",
			username: "bookish_sam",
			avatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=retro&s=120",
			currentPage: 95,
			role: "member" as ClubMemberRole,
		},
	];

	return {
		club: {
			id: clubId,
			name: `Reading Club ${clubId}`,
			cadence: "weekly" as CadenceType,
			inviteCode: clubId,
			advancedReviews: true,
			userRole: "admin" as ClubMemberRole,
		},
		activeCycle,
		members,
	};
};
