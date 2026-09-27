import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ClubExportPayload,
	downloadTextBlob,
	escapeCsvField,
	exportClubToJson,
	exportCyclesToCsv,
	exportProgressToCsv,
	exportReviewsToCsv,
	formatExportFilename,
	formatExportSlug,
} from "./export";

const mockPayload: ClubExportPayload = {
	club: {
		id: "c1",
		name: "Sci-Fi Readers",
		inviteCode: "READ4821",
		cadence: "weekly",
		createdAt: "2026-01-01T00:00:00.000Z",
	},
	cycles: [
		{
			id: "cy1",
			bookTitle: 'Dune, "Special Edition"',
			bookAuthor: "Frank Herbert",
			totalPages: 412,
			startDate: "2026-01-01",
			endDate: "2026-01-08",
			status: "completed",
			finalRating: 4.8,
		},
	],
	reviews: [
		{
			id: "r1",
			cycleId: "cy1",
			bookTitle: "Dune",
			username: "Alice",
			rating: 5.0,
			comment: "Masterpiece\nMust read!",
			createdAt: "2026-01-07T12:00:00.000Z",
			criteriaRatings: {
				plot: 5,
				characters: 4.5,
				pacing: 4,
				writing: 5,
				emotion: 4.5,
			},
		},
	],
	progress: [
		{
			userId: "u1",
			username: "Alice",
			cycleId: "cy1",
			bookTitle: "Dune",
			currentPage: 412,
			totalPages: 412,
			percent: 100,
		},
	],
	exportedAt: "2026-01-09T00:00:00.000Z",
};

describe("escapeCsvField", () => {
	it("escapes fields with quotes, commas, and newlines", () => {
		expect(escapeCsvField('Hello "World"')).toBe('"Hello ""World"""');
		expect(escapeCsvField("Hello, World")).toBe('"Hello, World"');
		expect(escapeCsvField("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
		expect(escapeCsvField(123)).toBe('"123"');
		expect(escapeCsvField(null)).toBe('""');
		expect(escapeCsvField(undefined)).toBe('""');
	});
});

describe("formatExportSlug & formatExportFilename", () => {
	it("generates sanitized slugs and file names", () => {
		expect(formatExportSlug("The Book Club (2026)")).toBe("the-book-club-2026");
		expect(formatExportSlug("")).toBe("club");

		expect(formatExportFilename("The Sci-Fi Club", "json")).toBe("the-sci-fi-club-history.json");
		expect(formatExportFilename("The Sci-Fi Club", "csv", "cycles")).toBe(
			"the-sci-fi-club-cycles.csv",
		);
		expect(formatExportFilename("The Sci-Fi Club", "csv")).toBe("the-sci-fi-club.csv");
	});
});

describe("exportClubToJson", () => {
	it("serializes payload to formatted JSON string", () => {
		const json = exportClubToJson(mockPayload);
		const parsed = JSON.parse(json);
		expect(parsed.club.name).toBe("Sci-Fi Readers");
		expect(parsed.cycles).toHaveLength(1);
		expect(parsed.reviews).toHaveLength(1);
		expect(parsed.progress).toHaveLength(1);
	});
});

describe("exportCyclesToCsv", () => {
	it("generates valid CSV with headers and cycle records", () => {
		const csv = exportCyclesToCsv(mockPayload.cycles);
		expect(csv).toContain('"Cycle ID","Book Title","Book Author"');
		expect(csv).toContain('"Frank Herbert"');
		expect(csv).toContain('"412"');
	});

	it("handles empty cycle lists cleanly", () => {
		const csv = exportCyclesToCsv([]);
		expect(csv).toBe(
			'"Cycle ID","Book Title","Book Author","Total Pages","Start Date","End Date","Status","Final Rating"',
		);
	});
});

describe("exportReviewsToCsv", () => {
	it("generates valid CSV with rubric criteria breakdown", () => {
		const csv = exportReviewsToCsv(mockPayload.reviews);
		expect(csv).toContain('"Review ID","Cycle ID","Book Title"');
		expect(csv).toContain('"Alice"');
		expect(csv).toContain('"5"');
	});
});

describe("exportProgressToCsv", () => {
	it("generates valid CSV with member progress data", () => {
		const csv = exportProgressToCsv(mockPayload.progress);
		expect(csv).toContain('"User ID","Username","Cycle ID"');
		expect(csv).toContain('"100"');
	});
});

describe("downloadTextBlob", () => {
	let appendChildMock: ReturnType<typeof vi.fn>;
	let removeChildMock: ReturnType<typeof vi.fn>;
	let clickMock: ReturnType<typeof vi.fn>;
	let createObjectURLMock: ReturnType<typeof vi.fn>;
	let revokeObjectURLMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clickMock = vi.fn();
		appendChildMock = vi.fn();
		removeChildMock = vi.fn();
		createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test");
		revokeObjectURLMock = vi.fn();

		const mockElement = {
			click: clickMock,
			href: "",
			download: "",
		};

		const mockDocument = {
			body: {
				appendChild: appendChildMock,
				removeChild: removeChildMock,
			},
			createElement: vi.fn().mockReturnValue(mockElement),
		};

		vi.stubGlobal("window", {});
		vi.stubGlobal("document", mockDocument);
		vi.stubGlobal("URL", {
			createObjectURL: createObjectURLMock,
			revokeObjectURL: revokeObjectURLMock,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("triggers client-side blob download and revokes URL", () => {
		downloadTextBlob('{"test":true}', "test.json", "application/json");
		expect(createObjectURLMock).toHaveBeenCalled();
		expect(appendChildMock).toHaveBeenCalled();
		expect(clickMock).toHaveBeenCalled();
		expect(removeChildMock).toHaveBeenCalled();
		expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test");
	});
});
