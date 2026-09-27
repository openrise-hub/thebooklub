import {
	formatMessageTimestamp,
	formatPageReference,
	isSpoiler,
	validateDiscussionMessage,
} from "$lib/club/discussion";
import {
	MESSAGE_MAX_LENGTH,
	MESSAGE_MIN_LENGTH,
	PAGE_REF_BOOK_WIDE,
} from "$lib/constants/discussion";
import { describe, expect, it } from "vitest";

describe("Spoiler & Discussion Logic (Task 9.1)", () => {
	describe("Spoiler Evaluation Matrix", () => {
		it("does not blur book-wide thoughts (page 0) for any user progress", () => {
			expect(isSpoiler(PAGE_REF_BOOK_WIDE, 0)).toBe(false);
			expect(isSpoiler(PAGE_REF_BOOK_WIDE, 50)).toBe(false);
			expect(isSpoiler(PAGE_REF_BOOK_WIDE, 500)).toBe(false);
		});

		it("does not blur comments when user has read past the tagged page", () => {
			expect(isSpoiler(10, 50)).toBe(false);
			expect(isSpoiler(49, 50)).toBe(false);
			expect(isSpoiler(1, 100)).toBe(false);
		});

		it("does not blur comments on the exact page the user is currently reading", () => {
			expect(isSpoiler(50, 50)).toBe(false);
			expect(isSpoiler(1, 1)).toBe(false);
			expect(isSpoiler(350, 350)).toBe(false);
		});

		it("blurs comments that reference pages ahead of the user's progress", () => {
			expect(isSpoiler(51, 50)).toBe(true);
			expect(isSpoiler(100, 50)).toBe(true);
			expect(isSpoiler(1, 0)).toBe(true);
			expect(isSpoiler(1000, 999)).toBe(true);
		});

		it("safely handles non-standard, negative, or NaN input values", () => {
			expect(isSpoiler(-5, 50)).toBe(false);
			expect(isSpoiler(Number.NaN, 50)).toBe(false);
			expect(isSpoiler(50, Number.NaN)).toBe(true);
			expect(isSpoiler(0, -10)).toBe(false);
		});
	});

	describe("Discussion Message Formatting", () => {
		it("formats page references accurately", () => {
			expect(formatPageReference(PAGE_REF_BOOK_WIDE)).toBe("Book-wide");
			expect(formatPageReference(1)).toBe("Page 1");
			expect(formatPageReference(150)).toBe("Page 150");
		});

		it("formats relative timestamps correctly", () => {
			const now = 1700000000000;
			expect(formatMessageTimestamp(now - 10000, now)).toBe("Just now");
			expect(formatMessageTimestamp(now - 120000, now)).toBe("2m ago");
			expect(formatMessageTimestamp(now - 7200000, now)).toBe("2h ago");
			expect(formatMessageTimestamp(now - 172800000, now)).toBe("2d ago");
		});
	});

	describe("Discussion Message Validation", () => {
		it("accepts valid comments within bounds", () => {
			const res = validateDiscussionMessage("Great chapter twist!", 45, 300);
			expect(res.valid).toBe(true);
			expect(res.error).toBeUndefined();
		});

		it("rejects empty or whitespace-only messages", () => {
			expect(validateDiscussionMessage("", 10, 300).valid).toBe(false);
			expect(validateDiscussionMessage("   ", 10, 300).valid).toBe(false);
		});

		it("rejects messages exceeding maximum length", () => {
			const longMsg = "a".repeat(MESSAGE_MAX_LENGTH + 1);
			const res = validateDiscussionMessage(longMsg, 10, 300);
			expect(res.valid).toBe(false);
			expect(res.error).toContain("maximum allowed length");
		});

		it("rejects invalid page references", () => {
			expect(validateDiscussionMessage("Nice", -1, 300).valid).toBe(false);
			expect(validateDiscussionMessage("Nice", Number.NaN, 300).valid).toBe(false);
			expect(validateDiscussionMessage("Nice", 350, 300).valid).toBe(false);
		});
	});
});
