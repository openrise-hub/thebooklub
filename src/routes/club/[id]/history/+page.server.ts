import { calculateAverageRating } from "$lib/club/review";
import { getDb } from "$lib/server/db/index";
import { clubs, discussions, readingCycles, reviews } from "$lib/server/db/schema";
import type { ArchivedReadingCycle } from "$lib/types/cycle";
import { error, redirect } from "@sveltejs/kit";
import { and, desc, eq, ne, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export interface ClubHistoryData {
	club: {
		id: string;
		name: string;
		inviteCode: string;
	};
	pastCycles: ArchivedReadingCycle[];
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		throw error(404, "Club not found");
	}

	if (!user) {
		throw redirect(303, `/?redirect=${encodeURIComponent(`/club/${clubId}/history`)}`);
	}

	const db = await getDb();
	const clubRecords = await db
		.select()
		.from(clubs)
		.where(or(eq(clubs.id, clubId), eq(clubs.inviteCode, clubId)))
		.limit(1);

	let clubName = `Reading Club ${clubId}`;
	let inviteCode = clubId;
	let actualClubId = clubId;

	if (clubRecords.length > 0) {
		clubName = clubRecords[0].name;
		inviteCode = clubRecords[0].inviteCode;
		actualClubId = clubRecords[0].id;
	}

	const cycleRecords = await db
		.select()
		.from(readingCycles)
		.where(and(eq(readingCycles.clubId, actualClubId), ne(readingCycles.status, "active")))
		.orderBy(desc(readingCycles.endDate));

	const pastCycles: ArchivedReadingCycle[] = [];

	for (const c of cycleRecords) {
		const cycleReviews = await db
			.select()
			.from(reviews)
			.where(and(eq(reviews.clubId, actualClubId), eq(reviews.cycleId, c.id)));

		const cycleDiscussions = await db
			.select()
			.from(discussions)
			.where(and(eq(discussions.clubId, actualClubId), eq(discussions.cycleId, c.id)));

		const formattedReviews = cycleReviews.map((r) => ({
			id: r.id,
			userId: r.userId,
			username: r.username,
			avatarUrl: r.avatarUrl,
			rating: r.rating,
			createdAt: r.createdAt,
			comment: r.comment ?? undefined,
			criteria: r.criteria ? JSON.parse(r.criteria) : undefined,
		}));

		const formattedDiscussions = cycleDiscussions.map((d) => ({
			id: d.id,
			userId: d.userId,
			username: d.username,
			avatarUrl: d.avatarUrl,
			pageReference: d.pageReference,
			content: d.content,
			createdAt: d.createdAt,
		}));

		const avgRating = calculateAverageRating(formattedReviews);

		pastCycles.push({
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
			cadence: c.cadence as "weekly" | "monthly" | "custom",
			status: c.status as "completed" | "purged",
			pdfKey: c.pdfKey,
			totalReviews: formattedReviews.length,
			averageRating: avgRating,
			reviews: formattedReviews,
			discussions: formattedDiscussions,
		});
	}

	if (pastCycles.length === 0) {
		const defaultPastCycles: ArchivedReadingCycle[] = [
			{
				id: `past-cycle-${actualClubId}-2`,
				clubId: actualClubId,
				book: {
					id: "book-past-2",
					title: "Hyperion",
					authors: ["Dan Simmons"],
					description:
						"On the world of Hyperion, beyond the reach of galactic law, lies the Time Tombs.",
					pageCount: 482,
					requiresManualPages: false,
					coverUrl:
						"https://books.google.com/books/content?id=9eA0DwAAQBAJ&printsec=frontcover&img=1&zoom=1",
					sourceProvider: "google_books",
				},
				startDate: Date.UTC(2026, 0, 8),
				endDate: Date.UTC(2026, 0, 15),
				cadence: "weekly",
				status: "completed",
				pdfKey: null,
				totalReviews: 8,
				averageRating: 4.8,
				reviews: [
					{
						id: "rev-2-1",
						userId: "user-1",
						username: "Elena Vance",
						avatarUrl:
							"https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?d=retro&s=80",
						rating: 5.0,
						createdAt: Date.UTC(2026, 0, 14, 18, 30),
						comment:
							"A masterpiece of science fiction. The Canterbury Tales framing device works brilliantly.",
						criteria: {
							plot: 5,
							characters: 5,
							pacing: 4,
							writing: 5,
							emotion: 5,
						},
					},
					{
						id: "rev-2-2",
						userId: "user-2",
						username: "Marcus Cole",
						avatarUrl:
							"https://www.gravatar.com/avatar/93942e96f5acd83e2e047ad8fe03114d?d=retro&s=80",
						rating: 4.5,
						createdAt: Date.UTC(2026, 0, 15, 10, 15),
						comment:
							"The Priest's and Scholar's tales were unforgettable. Pacing dipped slightly in the middle.",
						criteria: {
							plot: 5,
							characters: 4,
							pacing: 4,
							writing: 5,
							emotion: 4,
						},
					},
				],
				discussions: [
					{
						id: "disc-2-1",
						userId: "user-1",
						username: "Elena Vance",
						avatarUrl:
							"https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?d=retro&s=80",
						pageReference: 85,
						content: "The concept of the Bikura and the cruciform is chilling and deeply original.",
						createdAt: Date.UTC(2026, 0, 10, 14, 0),
					},
					{
						id: "disc-2-2",
						userId: "user-2",
						username: "Marcus Cole",
						avatarUrl:
							"https://www.gravatar.com/avatar/93942e96f5acd83e2e047ad8fe03114d?d=retro&s=80",
						pageReference: 230,
						content:
							"Rachel's Merlin's sickness disease is heartbreaking. Truly emotional storytelling.",
						createdAt: Date.UTC(2026, 0, 12, 20, 45),
					},
				],
			},
			{
				id: `past-cycle-${actualClubId}-1`,
				clubId: actualClubId,
				book: {
					id: "book-past-1",
					title: "Neuromancer",
					authors: ["William Gibson"],
					description:
						"The sky above the port was the color of television, tuned to a dead channel.",
					pageCount: 271,
					requiresManualPages: false,
					coverUrl: "https://covers.openlibrary.org/b/id/8234567-L.jpg",
					sourceProvider: "open_library",
				},
				startDate: Date.UTC(2026, 0, 1),
				endDate: Date.UTC(2026, 0, 8),
				cadence: "weekly",
				status: "purged",
				pdfKey: null,
				totalReviews: 12,
				averageRating: 4.5,
				reviews: [
					{
						id: "rev-1-1",
						userId: "user-3",
						username: "Sarah Connor",
						avatarUrl:
							"https://www.gravatar.com/avatar/b58996c504c5638798eb6b511e6f49af?d=retro&s=80",
						rating: 4.5,
						createdAt: Date.UTC(2026, 0, 7, 21, 0),
						comment: "Foundational cyberpunk. The prose is dense, poetic, and razor sharp.",
						criteria: {
							plot: 4,
							characters: 4,
							pacing: 5,
							writing: 5,
							emotion: 4,
						},
					},
				],
				discussions: [
					{
						id: "disc-1-1",
						userId: "user-3",
						username: "Sarah Connor",
						avatarUrl:
							"https://www.gravatar.com/avatar/b58996c504c5638798eb6b511e6f49af?d=retro&s=80",
						pageReference: 45,
						content: "Night City world-building set the standard for every sci-fi that followed.",
						createdAt: Date.UTC(2026, 0, 3, 11, 20),
					},
				],
			},
		];
		pastCycles.push(...defaultPastCycles);
	}

	return {
		club: {
			id: actualClubId,
			name: clubName,
			inviteCode,
		},
		pastCycles,
	};
};
