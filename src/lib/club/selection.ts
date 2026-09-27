import { MAX_CANDIDATE_BOOKS, MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import {
	DEFAULT_SELECTION_MODE,
	SELECTION_COLOR_PALETTE,
	SELECTION_THEME_COLORS,
	type SelectionMode,
	type SelectionStatus,
	type SelectionThemeColor,
} from "$lib/constants/selection";

export interface CandidateBook {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	totalPages: number;
	themeColor: SelectionThemeColor;
	colorHex: string;
}

export interface SelectionSession {
	id: string;
	clubId: string;
	mode: SelectionMode;
	status: SelectionStatus;
	candidates: CandidateBook[];
	pollDurationHours?: number;
	pollEndsAt?: string;
	winnerId?: string | null;
	seed?: number;
	createdAt: string;
}

export function assignCandidateColor(index: number): {
	themeColor: SelectionThemeColor;
	colorHex: string;
} {
	const safeIndex = Math.max(0, index);
	const themeColor = SELECTION_THEME_COLORS[safeIndex % SELECTION_THEME_COLORS.length];
	const colorHex = SELECTION_COLOR_PALETTE[safeIndex % SELECTION_COLOR_PALETTE.length];
	return { themeColor, colorHex };
}

export function validateCandidateCount(count: number): {
	valid: boolean;
	error?: string;
} {
	if (count < MIN_CANDIDATE_BOOKS) {
		return {
			valid: false,
			error: `Selection requires at least ${MIN_CANDIDATE_BOOKS} candidate books.`,
		};
	}
	if (count > MAX_CANDIDATE_BOOKS) {
		return {
			valid: false,
			error: `Selection cannot exceed ${MAX_CANDIDATE_BOOKS} candidate books.`,
		};
	}
	return { valid: true };
}

export function createCandidateBook(
	data: {
		id?: string;
		title: string;
		author: string;
		coverUrl?: string;
		totalPages?: number;
	},
	index: number,
): CandidateBook {
	const { themeColor, colorHex } = assignCandidateColor(index);
	return {
		id: data.id || `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		title: (data.title || "Untitled Book").trim(),
		author: (data.author || "Unknown Author").trim(),
		coverUrl: data.coverUrl || "",
		totalPages: Math.max(1, data.totalPages || 1),
		themeColor,
		colorHex,
	};
}

export function calculateTimeRemaining(
	endsAt: string | Date,
	now: Date = new Date(),
): {
	totalMs: number;
	hours: number;
	minutes: number;
	seconds: number;
	isExpired: boolean;
} {
	const endMs = new Date(endsAt).getTime();
	const nowMs = now.getTime();
	const totalMs = Math.max(0, endMs - nowMs);
	const isExpired = totalMs <= 0;

	const totalSeconds = Math.floor(totalMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return { totalMs, hours, minutes, seconds, isExpired };
}
