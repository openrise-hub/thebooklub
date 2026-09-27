import { DEFAULT_EXPORT_FORMAT, EXPORT_MIME_TYPES, type ExportFormat } from "$lib/constants/export";

export interface ExportClubMetadata {
	id: string;
	name: string;
	inviteCode: string;
	cadence: string;
	createdAt: string;
}

export interface ExportCycle {
	id: string;
	bookTitle: string;
	bookAuthor: string;
	totalPages: number;
	startDate: string;
	endDate: string;
	status: string;
	finalRating?: number | null;
}

export interface ExportReview {
	id: string;
	cycleId: string;
	bookTitle: string;
	username: string;
	rating: number;
	comment?: string | null;
	createdAt: string;
	criteriaRatings?: {
		plot?: number;
		characters?: number;
		pacing?: number;
		writing?: number;
		emotion?: number;
	} | null;
}

export interface ExportMemberProgress {
	userId: string;
	username: string;
	cycleId: string;
	bookTitle: string;
	currentPage: number;
	totalPages: number;
	percent: number;
}

export interface ClubExportPayload {
	club: ExportClubMetadata;
	cycles: ExportCycle[];
	reviews: ExportReview[];
	progress: ExportMemberProgress[];
	exportedAt: string;
}

export function escapeCsvField(val: unknown): string {
	if (val === null || val === undefined) {
		return '""';
	}
	const str = String(val);
	if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return `"${str}"`;
}

export function formatExportSlug(input: string): string {
	if (!input) return "club";
	return (
		input
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "club"
	);
}

export function formatExportFilename(
	clubName: string,
	format: ExportFormat = DEFAULT_EXPORT_FORMAT,
	dataset?: string,
): string {
	const slug = formatExportSlug(clubName);
	if (format === "json") {
		return `${slug}-history.json`;
	}
	const cleanDataset = dataset ? `-${formatExportSlug(dataset)}` : "";
	return `${slug}${cleanDataset}.csv`;
}

export function exportClubToJson(payload: ClubExportPayload): string {
	return JSON.stringify(payload, null, 2);
}

export function exportCyclesToCsv(cycles: ExportCycle[]): string {
	const headers = [
		"Cycle ID",
		"Book Title",
		"Book Author",
		"Total Pages",
		"Start Date",
		"End Date",
		"Status",
		"Final Rating",
	];

	const rows = (cycles || []).map((c) => [
		escapeCsvField(c.id),
		escapeCsvField(c.bookTitle),
		escapeCsvField(c.bookAuthor),
		escapeCsvField(c.totalPages),
		escapeCsvField(c.startDate),
		escapeCsvField(c.endDate),
		escapeCsvField(c.status),
		escapeCsvField(c.finalRating ?? ""),
	]);

	return [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportReviewsToCsv(reviews: ExportReview[]): string {
	const headers = [
		"Review ID",
		"Cycle ID",
		"Book Title",
		"Username",
		"Rating",
		"Comment",
		"Plot Score",
		"Characters Score",
		"Pacing Score",
		"Writing Score",
		"Emotion Score",
		"Created At",
	];

	const rows = (reviews || []).map((r) => [
		escapeCsvField(r.id),
		escapeCsvField(r.cycleId),
		escapeCsvField(r.bookTitle),
		escapeCsvField(r.username),
		escapeCsvField(r.rating),
		escapeCsvField(r.comment ?? ""),
		escapeCsvField(r.criteriaRatings?.plot ?? ""),
		escapeCsvField(r.criteriaRatings?.characters ?? ""),
		escapeCsvField(r.criteriaRatings?.pacing ?? ""),
		escapeCsvField(r.criteriaRatings?.writing ?? ""),
		escapeCsvField(r.criteriaRatings?.emotion ?? ""),
		escapeCsvField(r.createdAt),
	]);

	return [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportProgressToCsv(progress: ExportMemberProgress[]): string {
	const headers = [
		"User ID",
		"Username",
		"Cycle ID",
		"Book Title",
		"Current Page",
		"Total Pages",
		"Progress Percent",
	];

	const rows = (progress || []).map((p) => [
		escapeCsvField(p.userId),
		escapeCsvField(p.username),
		escapeCsvField(p.cycleId),
		escapeCsvField(p.bookTitle),
		escapeCsvField(p.currentPage),
		escapeCsvField(p.totalPages),
		escapeCsvField(p.percent),
	]);

	return [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadTextBlob(
	content: string,
	filename: string,
	mimeType: string = EXPORT_MIME_TYPES.json,
): void {
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
