import {
	type ClubExportPayload,
	exportClubToJson,
	exportCyclesToCsv,
	exportProgressToCsv,
	exportReviewsToCsv,
	formatExportFilename,
} from "$lib/utils/export";
import { describe, expect, it } from "vitest";

const mockPayload: ClubExportPayload = {
	club: {
		id: "club-1",
		name: "Reading Guild",
		inviteCode: "GUILD123",
		cadence: "monthly",
		createdAt: "2026-01-01T00:00:00Z",
	},
	cycles: [
		{
			id: "cycle-1",
			bookTitle: "Fahrenheit 451",
			bookAuthor: "Ray Bradbury",
			totalPages: 249,
			startDate: "2026-01-01",
			endDate: "2026-01-31",
			status: "completed",
			finalRating: 4.6,
		},
	],
	reviews: [
		{
			id: "rev-1",
			cycleId: "cycle-1",
			bookTitle: "Fahrenheit 451",
			username: "Bob",
			rating: 4.5,
			comment: "Great book",
			createdAt: "2026-01-30T00:00:00Z",
		},
	],
	progress: [
		{
			userId: "u1",
			username: "Bob",
			cycleId: "cycle-1",
			bookTitle: "Fahrenheit 451",
			currentPage: 249,
			totalPages: 249,
			percent: 100,
		},
	],
	exportedAt: "2026-02-01T00:00:00Z",
};

describe("ExportModal Data Preparation Logic", () => {
	it("formats correct JSON and CSV filenames for club", () => {
		expect(formatExportFilename(mockPayload.club.name, "json")).toBe("reading-guild-history.json");
		expect(formatExportFilename(mockPayload.club.name, "csv", "cycles")).toBe(
			"reading-guild-cycles.csv",
		);
		expect(formatExportFilename(mockPayload.club.name, "csv", "reviews")).toBe(
			"reading-guild-reviews.csv",
		);
		expect(formatExportFilename(mockPayload.club.name, "csv", "progress")).toBe(
			"reading-guild-progress.csv",
		);
	});

	it("produces valid JSON and CSV strings from payload", () => {
		const json = exportClubToJson(mockPayload);
		expect(json).toContain('"name": "Reading Guild"');

		const cyclesCsv = exportCyclesToCsv(mockPayload.cycles);
		expect(cyclesCsv).toContain('"Fahrenheit 451"');

		const reviewsCsv = exportReviewsToCsv(mockPayload.reviews);
		expect(reviewsCsv).toContain('"Bob"');

		const progressCsv = exportProgressToCsv(mockPayload.progress);
		expect(progressCsv).toContain('"249"');
	});
});
