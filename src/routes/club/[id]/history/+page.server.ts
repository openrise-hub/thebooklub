import type { ArchivedReadingCycle } from "$lib/types/cycle";
import { error, redirect } from "@sveltejs/kit";
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

	const pastCycles: ArchivedReadingCycle[] = [
		{
			id: `past-cycle-${clubId}-2`,
			clubId,
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
			id: `past-cycle-${clubId}-1`,
			clubId,
			book: {
				id: "book-past-1",
				title: "Neuromancer",
				authors: ["William Gibson"],
				description: "The sky above the port was the color of television, tuned to a dead channel.",
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

	return {
		club: {
			id: clubId,
			name: `Reading Club ${clubId}`,
			inviteCode: clubId,
		},
		pastCycles,
	};
};
