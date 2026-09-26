import type { CadenceType, CycleStatus } from "$lib/constants/cadence";
import type { NormalizedBook } from "./book";

export interface ReadingCycle {
	id: string;
	clubId: string;
	book: NormalizedBook;
	startDate: number;
	endDate: number;
	cadence: CadenceType;
	status: CycleStatus;
	pdfKey?: string | null;
	totalReviews?: number;
	averageRating?: number;
}

export interface ArchivedReview {
	id: string;
	userId: string;
	username: string;
	avatarUrl: string;
	rating: number;
	createdAt: number;
	comment?: string;
	criteria?: {
		plot: number;
		characters: number;
		pacing: number;
		writing: number;
		emotion: number;
	};
}

export interface ArchivedMessage {
	id: string;
	userId: string;
	username: string;
	avatarUrl: string;
	pageReference: number;
	content: string;
	createdAt: number;
}

export interface ArchivedReadingCycle extends ReadingCycle {
	reviews?: ArchivedReview[];
	discussions?: ArchivedMessage[];
}

export interface CycleEvaluation {
	status: CycleStatus;
	isExpired: boolean;
	timeRemainingMs: number;
	formattedRemaining: {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		isOverdue: boolean;
	};
}
