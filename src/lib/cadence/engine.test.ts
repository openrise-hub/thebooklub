import { PURGE_DELAY_MS } from "$lib/constants/cadence";
import type { ReadingCycle } from "$lib/types/cycle";
import { describe, expect, it } from "vitest";
import {
	calculateCycleEndDate,
	evaluateCycleState,
	formatCountdown,
	shouldPurgeCyclePdf,
} from "./engine";

describe("calculateCycleEndDate", () => {
	it("calculates weekly cadence exactly 7 days from start", () => {
		const start = Date.UTC(2026, 0, 1, 12, 0, 0); // Jan 1, 2026 12:00:00 UTC
		const expectedEnd = start + 7 * 24 * 60 * 60 * 1000;
		const result = calculateCycleEndDate(start, "weekly");

		expect(result).toBe(expectedEnd);
	});

	it("calculates monthly cadence to the final millisecond of the month", () => {
		const start = Date.UTC(2026, 0, 15, 10, 0, 0); // Jan 15, 2026
		const result = calculateCycleEndDate(start, "monthly");
		const expected = Date.UTC(2026, 0, 31, 23, 59, 59, 999);

		expect(result).toBe(expected);
	});

	it("handles February in leap year correctly for monthly cadence", () => {
		const startLeap = Date.UTC(2028, 1, 5); // Feb 5, 2028 (leap year)
		const result = calculateCycleEndDate(startLeap, "monthly");
		const expected = Date.UTC(2028, 1, 29, 23, 59, 59, 999);

		expect(result).toBe(expected);
	});

	it("calculates custom cadence with valid end date", () => {
		const start = Date.UTC(2026, 5, 1);
		const customEnd = Date.UTC(2026, 5, 20);
		const result = calculateCycleEndDate(start, "custom", customEnd);

		expect(result).toBe(customEnd);
	});

	it("throws error when custom cadence has invalid end date", () => {
		const start = Date.UTC(2026, 5, 10);
		const invalidEnd = Date.UTC(2026, 5, 5);

		expect(() => calculateCycleEndDate(start, "custom", invalidEnd)).toThrow(
			"Custom end date must be strictly after the start date",
		);
		expect(() => calculateCycleEndDate(start, "custom")).toThrow(
			"Custom cadence requires a valid target end date",
		);
	});
});

describe("evaluateCycleState & formatCountdown", () => {
	const mockCycle: ReadingCycle = {
		id: "cycle-1",
		clubId: "READ-4821",
		book: {
			id: "book-1",
			title: "Neuromancer",
			authors: ["William Gibson"],
			pageCount: 271,
			requiresManualPages: false,
			coverUrl: null,
			sourceProvider: "open_library",
		},
		startDate: Date.UTC(2026, 0, 1),
		endDate: Date.UTC(2026, 0, 8),
		cadence: "weekly",
		status: "active",
	};

	it("evaluates active cycle before deadline with countdown breakdown", () => {
		const now = Date.UTC(2026, 0, 4, 12, 0, 0); // 3.5 days remaining
		const evalState = evaluateCycleState(mockCycle, now);

		expect(evalState.status).toBe("active");
		expect(evalState.isExpired).toBe(false);
		expect(evalState.formattedRemaining.days).toBe(3);
		expect(evalState.formattedRemaining.hours).toBe(12);
		expect(formatCountdown(evalState)).toBe("3d 12h remaining");
	});

	it("evaluates cycle past deadline as completed", () => {
		const now = Date.UTC(2026, 0, 9);
		const evalState = evaluateCycleState(mockCycle, now);

		expect(evalState.status).toBe("completed");
		expect(evalState.isExpired).toBe(true);
		expect(evalState.timeRemainingMs).toBe(0);
		expect(formatCountdown(evalState)).toBe("Cycle Completed");
	});

	it("preserves purged status when cycle was purged", () => {
		const purgedCycle: ReadingCycle = {
			...mockCycle,
			status: "purged",
		};
		const now = Date.UTC(2026, 0, 15);
		const evalState = evaluateCycleState(purgedCycle, now);

		expect(evalState.status).toBe("purged");
		expect(evalState.isExpired).toBe(true);
	});
});

describe("shouldPurgeCyclePdf (24-Hour Purge Protocol)", () => {
	const cycleWithPdf: ReadingCycle = {
		id: "c-pdf",
		clubId: "CLUB-1",
		book: {
			id: "b-1",
			title: "Test Book",
			authors: ["Test Author"],
			pageCount: 200,
			requiresManualPages: false,
			coverUrl: null,
			sourceProvider: "open_library",
		},
		startDate: Date.UTC(2026, 0, 1),
		endDate: Date.UTC(2026, 0, 8),
		cadence: "weekly",
		status: "active",
		pdfKey: "uploads/club-1/test.pdf",
	};

	it("returns false if cycle has no pdfKey", () => {
		const cycleWithoutPdf = { ...cycleWithPdf, pdfKey: null };
		const now = cycleWithPdf.endDate + PURGE_DELAY_MS + 1000;
		expect(shouldPurgeCyclePdf(cycleWithoutPdf, now)).toBe(false);
	});

	it("returns false while cycle is active before deadline", () => {
		const now = cycleWithPdf.endDate - 1000;
		expect(shouldPurgeCyclePdf(cycleWithPdf, now)).toBe(false);
	});

	it("returns false during the 24-hour grace window after deadline", () => {
		const now = cycleWithPdf.endDate + 12 * 60 * 60 * 1000; // 12h past
		expect(shouldPurgeCyclePdf(cycleWithPdf, now)).toBe(false);
	});

	it("returns true when cycle is 24+ hours past deadline", () => {
		const now = cycleWithPdf.endDate + PURGE_DELAY_MS + 1000;
		expect(shouldPurgeCyclePdf(cycleWithPdf, now)).toBe(true);
	});

	it("returns false if cycle is already purged", () => {
		const purged = { ...cycleWithPdf, status: "purged" as const };
		const now = cycleWithPdf.endDate + PURGE_DELAY_MS + 1000;
		expect(shouldPurgeCyclePdf(purged, now)).toBe(false);
	});
});
