import { PURGE_DELAY_MS } from "$lib/constants/cadence";
import type { NormalizedBook } from "$lib/types/book";
import type { ReadingCycle } from "$lib/types/cycle";
import { describe, expect, it, vi } from "vitest";
import type { ServerEnv } from "./env";
import { evaluateCyclePurgeStatus, purgeSingleCycle, runPurgeProtocol } from "./purge";

const mockEnv: ServerEnv = {
	AUTH_SECRET: "test-auth-secret",
};

const baseBook: NormalizedBook = {
	id: "book-1",
	title: "Clean Code",
	authors: ["Robert C. Martin"],
	pageCount: 464,
	requiresManualPages: false,
	coverUrl: null,
	sourceProvider: "google_books",
};

describe("evaluateCyclePurgeStatus", () => {
	const now = 1700000000000;

	it("returns not eligible if cycle has no PDF key", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 30 * 24 * 60 * 60 * 1000,
			endDate: now - 48 * 60 * 60 * 1000,
			cadence: "weekly",
			status: "completed",
			pdfKey: null,
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(false);
		expect(evaluation.isAborted).toBe(false);
		expect(evaluation.reason).toContain("No PDF file key");
	});

	it("returns not eligible if cycle is already purged", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 30 * 24 * 60 * 60 * 1000,
			endDate: now - 48 * 60 * 60 * 1000,
			cadence: "weekly",
			status: "purged",
			pdfKey: "clubs/club-1/cycles/c1/doc.pdf",
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(false);
		expect(evaluation.isAborted).toBe(false);
		expect(evaluation.reason).toContain("already been purged");
	});

	it("aborts purge if cycle deadline was extended into the future", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 10 * 24 * 60 * 60 * 1000,
			endDate: now + 5 * 24 * 60 * 60 * 1000,
			cadence: "custom",
			status: "completed",
			pdfKey: "clubs/club-1/cycles/c1/doc.pdf",
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(false);
		expect(evaluation.isAborted).toBe(true);
		expect(evaluation.reason).toContain("Purge Aborted");
	});

	it("aborts purge if cycle status is active", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 10 * 24 * 60 * 60 * 1000,
			endDate: now - 1000,
			cadence: "weekly",
			status: "active",
			pdfKey: "clubs/club-1/cycles/c1/doc.pdf",
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(false);
		expect(evaluation.isAborted).toBe(true);
		expect(evaluation.reason).toContain("Purge Aborted");
	});

	it("skips purge if cycle is completed but within 24-hour grace window", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 7 * 24 * 60 * 60 * 1000,
			endDate: now - 12 * 60 * 60 * 1000,
			cadence: "weekly",
			status: "completed",
			pdfKey: "clubs/club-1/cycles/c1/doc.pdf",
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(false);
		expect(evaluation.isAborted).toBe(false);
		expect(evaluation.remainingGraceMs).toBe(12 * 60 * 60 * 1000);
		expect(evaluation.reason).toContain("grace period");
	});

	it("marks cycle eligible if 24-hour post-cycle grace period expired", () => {
		const cycle: ReadingCycle = {
			id: "c1",
			clubId: "club-1",
			book: baseBook,
			startDate: now - 7 * 24 * 60 * 60 * 1000,
			endDate: now - 25 * 60 * 60 * 1000,
			cadence: "weekly",
			status: "completed",
			pdfKey: "clubs/club-1/cycles/c1/doc.pdf",
		};

		const evaluation = evaluateCyclePurgeStatus(cycle, now);
		expect(evaluation.eligible).toBe(true);
		expect(evaluation.isAborted).toBe(false);
		expect(evaluation.remainingGraceMs).toBe(0);
		expect(evaluation.reason).toContain("expired");
	});
});

describe("purgeSingleCycle", () => {
	const now = 1700000000000;

	it("executes R2 delete and marks cycle as purged while retaining reviews and metadata", async () => {
		const deleteMock = vi.fn().mockResolvedValue(true);
		const cycle: ReadingCycle = {
			id: "cy-expired",
			clubId: "club-4821",
			book: baseBook,
			startDate: now - 14 * 24 * 60 * 60 * 1000,
			endDate: now - PURGE_DELAY_MS - 3600000,
			cadence: "weekly",
			status: "completed",
			pdfKey: "clubs/club-4821/cycles/cy-expired/book.pdf",
			totalReviews: 8,
			averageRating: 4.5,
		};

		const { result, updatedCycle } = await purgeSingleCycle(mockEnv, cycle, {
			now,
			deleteFn: deleteMock,
		});

		expect(deleteMock).toHaveBeenCalledWith(mockEnv, "clubs/club-4821/cycles/cy-expired/book.pdf");
		expect(result.action).toBe("purged");
		expect(result.deletedFromStorage).toBe(true);

		expect(updatedCycle.pdfKey).toBeNull();
		expect(updatedCycle.status).toBe("purged");
		expect(updatedCycle.totalReviews).toBe(8);
		expect(updatedCycle.averageRating).toBe(4.5);
		expect(updatedCycle.book.title).toBe("Clean Code");
	});

	it("handles deadline extension by resetting status to active and skipping deletion", async () => {
		const deleteMock = vi.fn();
		const cycle: ReadingCycle = {
			id: "cy-extended",
			clubId: "club-4821",
			book: baseBook,
			startDate: now - 10 * 24 * 60 * 60 * 1000,
			endDate: now + 24 * 60 * 60 * 1000,
			cadence: "custom",
			status: "completed",
			pdfKey: "clubs/club-4821/cycles/cy-extended/book.pdf",
		};

		const { result, updatedCycle } = await purgeSingleCycle(mockEnv, cycle, {
			now,
			deleteFn: deleteMock,
		});

		expect(deleteMock).not.toHaveBeenCalled();
		expect(result.action).toBe("aborted");
		expect(updatedCycle.status).toBe("active");
		expect(updatedCycle.pdfKey).toBe("clubs/club-4821/cycles/cy-extended/book.pdf");
	});
});

describe("runPurgeProtocol", () => {
	const now = 1700000000000;

	it("evaluates a batch of cycles and reports aggregate statistics", async () => {
		const deleteMock = vi.fn().mockResolvedValue(true);
		const cycles: ReadingCycle[] = [
			{
				id: "cy-1",
				clubId: "club-1",
				book: baseBook,
				startDate: now - 14 * 24 * 60 * 60 * 1000,
				endDate: now - PURGE_DELAY_MS - 5000,
				cadence: "weekly",
				status: "completed",
				pdfKey: "key-1.pdf",
			},
			{
				id: "cy-2",
				clubId: "club-1",
				book: baseBook,
				startDate: now - 5 * 24 * 60 * 60 * 1000,
				endDate: now - 2 * 60 * 60 * 1000,
				cadence: "weekly",
				status: "completed",
				pdfKey: "key-2.pdf",
			},
			{
				id: "cy-3",
				clubId: "club-1",
				book: baseBook,
				startDate: now - 5 * 24 * 60 * 60 * 1000,
				endDate: now + 24 * 60 * 60 * 1000,
				cadence: "custom",
				status: "active",
				pdfKey: "key-3.pdf",
			},
		];

		const report = await runPurgeProtocol(mockEnv, cycles, {
			now,
			deleteFn: deleteMock,
		});

		expect(report.evaluatedCount).toBe(3);
		expect(report.purgedCount).toBe(1);
		expect(report.skippedCount).toBe(1);
		expect(report.abortedCount).toBe(1);
		expect(report.results).toHaveLength(3);
		expect(report.updatedCycles[0].status).toBe("purged");
		expect(report.updatedCycles[1].status).toBe("completed");
		expect(report.updatedCycles[2].status).toBe("active");
	});
});
