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
