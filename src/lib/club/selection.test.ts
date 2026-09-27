import { describe, expect, it } from "vitest";
import {
	assignCandidateColor,
	calculateTimeRemaining,
	createCandidateBook,
	validateCandidateCount,
} from "./selection";

describe("assignCandidateColor", () => {
	it("assigns cyclical theme colors and unique palette hex codes", () => {
		const c0 = assignCandidateColor(0);
		expect(c0.themeColor).toBe("purple");
		expect(c0.colorHex).toBe("#46178f");

		const c1 = assignCandidateColor(1);
		expect(c1.themeColor).toBe("blue");
		expect(c1.colorHex).toBe("#1368ce");

		const c5 = assignCandidateColor(5);
		expect(c5.themeColor).toBe("purple"); // Wrapped around 5 theme colors
		expect(c5.colorHex).toBe("#6a2cd8"); // Distinct palette index
	});
});

describe("validateCandidateCount", () => {
	it("validates valid candidate counts between 2 and 12", () => {
		expect(validateCandidateCount(2).valid).toBe(true);
		expect(validateCandidateCount(6).valid).toBe(true);
		expect(validateCandidateCount(12).valid).toBe(true);
	});

	it("rejects candidate counts outside bounds", () => {
		const tooFew = validateCandidateCount(1);
		expect(tooFew.valid).toBe(false);
		expect(tooFew.error).toContain("at least 2");

		const tooMany = validateCandidateCount(13);
		expect(tooMany.valid).toBe(false);
		expect(tooMany.error).toContain("cannot exceed 12");
	});
});

describe("createCandidateBook", () => {
	it("creates a candidate book with assigned color and defaults", () => {
		const book = createCandidateBook(
			{
				title: "Dune",
				author: "Frank Herbert",
				totalPages: 412,
			},
			0,
		);

		expect(book.title).toBe("Dune");
		expect(book.author).toBe("Frank Herbert");
		expect(book.totalPages).toBe(412);
		expect(book.themeColor).toBe("purple");
		expect(book.colorHex).toBe("#46178f");
		expect(book.id).toBeDefined();
	});
});

describe("calculateTimeRemaining", () => {
	it("calculates remaining hours, minutes, and seconds", () => {
		const now = new Date("2026-01-01T12:00:00Z");
		const endsAt = new Date("2026-01-01T14:30:15Z");

		const rem = calculateTimeRemaining(endsAt, now);
		expect(rem.isExpired).toBe(false);
		expect(rem.hours).toBe(2);
		expect(rem.minutes).toBe(30);
		expect(rem.seconds).toBe(15);
	});

	it("detects expired countdowns correctly", () => {
		const now = new Date("2026-01-01T15:00:00Z");
		const endsAt = new Date("2026-01-01T14:00:00Z");

		const rem = calculateTimeRemaining(endsAt, now);
		expect(rem.isExpired).toBe(true);
		expect(rem.totalMs).toBe(0);
		expect(rem.hours).toBe(0);
	});
});
