import {
	MESSAGE_MAX_LENGTH,
	MESSAGE_MIN_LENGTH,
	PAGE_REF_BOOK_WIDE,
} from "$lib/constants/discussion";
import type { DiscussionMessage } from "$lib/types/discussion";
import { describe, expect, it } from "vitest";
import {
	formatMessageTimestamp,
	formatPageReference,
	validateDiscussionMessage,
} from "../club/discussion";

describe("DiscussionFeed Component Logic & Constants", () => {
	it("enforces message length boundaries and page defaults", () => {
		expect(MESSAGE_MIN_LENGTH).toBe(1);
		expect(MESSAGE_MAX_LENGTH).toBe(2000);
		expect(PAGE_REF_BOOK_WIDE).toBe(0);
	});

	it("validates valid milestone discussion comment", () => {
		const validation = validateDiscussionMessage(
			"The pacing in this section is electrifying!",
			120,
			300,
		);
		expect(validation.valid).toBe(true);
		expect(validation.error).toBeUndefined();
	});

	it("validates book-wide thought (page 0)", () => {
		const validation = validateDiscussionMessage("Masterpiece from start to finish.", 0, 300);
		expect(validation.valid).toBe(true);
	});

	it("rejects blank or overflow content", () => {
		expect(validateDiscussionMessage("   ", 10, 300).valid).toBe(false);
		expect(validateDiscussionMessage("x".repeat(2005), 10, 300).valid).toBe(false);
	});

	it("rejects out-of-bounds page reference", () => {
		expect(validateDiscussionMessage("Nice", -1, 300).valid).toBe(false);
		expect(validateDiscussionMessage("Nice", 350, 300).valid).toBe(false);
	});

	it("formats page tags accurately for UI display", () => {
		expect(formatPageReference(0)).toBe("Book-wide");
		expect(formatPageReference(45)).toBe("Page 45");
	});

	it("formats chronological timestamps correctly", () => {
		const now = Date.now();
		expect(formatMessageTimestamp(now - 10000, now)).toBe("Just now");
		expect(formatMessageTimestamp(now - 10 * 60 * 1000, now)).toBe("10m ago");
		expect(formatMessageTimestamp(now - 2 * 3600 * 1000, now)).toBe("2h ago");
		expect(formatMessageTimestamp(now - 24 * 3600 * 1000, now)).toBe("1d ago");
	});

	it("handles message stream chronological sorting", () => {
		const messages: DiscussionMessage[] = [
			{
				id: "m2",
				clubId: "c1",
				cycleId: "cy1",
				userId: "u2",
				username: "ReaderB",
				avatarUrl: "https://avatar.com/b",
				content: "Second message",
				pageReference: 50,
				createdAt: 2000,
			},
			{
				id: "m1",
				clubId: "c1",
				cycleId: "cy1",
				userId: "u1",
				username: "ReaderA",
				avatarUrl: "https://avatar.com/a",
				content: "First message",
				pageReference: 10,
				createdAt: 1000,
			},
		];

		const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
		expect(sorted[0].id).toBe("m1");
		expect(sorted[1].id).toBe("m2");
	});
});
