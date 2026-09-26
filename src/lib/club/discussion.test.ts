import { describe, expect, it } from "vitest";
import {
	formatMessageTimestamp,
	formatPageReference,
	validateDiscussionMessage,
} from "./discussion";

describe("validateDiscussionMessage", () => {
	it("accepts valid messages with page references", () => {
		const result = validateDiscussionMessage("I love chapter 3!", 45, 300);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("accepts book-wide messages (page 0)", () => {
		const result = validateDiscussionMessage("Overall great themes.", 0, 300);
		expect(result.valid).toBe(true);
	});

	it("rejects empty or whitespace-only messages", () => {
		const emptyResult = validateDiscussionMessage("", 10, 300);
		expect(emptyResult.valid).toBe(false);
		expect(emptyResult.error).toContain("cannot be empty");

		const whitespaceResult = validateDiscussionMessage("   ", 10, 300);
		expect(whitespaceResult.valid).toBe(false);
	});

	it("rejects messages exceeding 2000 characters", () => {
		const longText = "a".repeat(2001);
		const result = validateDiscussionMessage(longText, 10, 300);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("exceeds maximum allowed length");
	});

	it("rejects negative page references", () => {
		const result = validateDiscussionMessage("Thoughts here", -5, 300);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("cannot be negative");
	});

	it("rejects page references exceeding total pages", () => {
		const result = validateDiscussionMessage("Thoughts on end", 350, 300);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("cannot exceed total book pages");
	});

	it("rejects non-numeric or NaN page references", () => {
		const result = validateDiscussionMessage("Thoughts", Number.NaN, 300);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("valid number");
	});
});

describe("formatPageReference", () => {
	it("formats 0 as Book-wide", () => {
		expect(formatPageReference(0)).toBe("Book-wide");
	});

	it("formats specific page numbers", () => {
		expect(formatPageReference(12)).toBe("Page 12");
		expect(formatPageReference(250)).toBe("Page 250");
	});
});

describe("formatMessageTimestamp", () => {
	const baseNow = 1700000000000;

	it("formats just now for recent seconds", () => {
		expect(formatMessageTimestamp(baseNow - 20000, baseNow)).toBe("Just now");
	});

	it("formats minutes ago", () => {
		expect(formatMessageTimestamp(baseNow - 5 * 60 * 1000, baseNow)).toBe("5m ago");
	});

	it("formats hours ago", () => {
		expect(formatMessageTimestamp(baseNow - 3 * 60 * 60 * 1000, baseNow)).toBe("3h ago");
	});

	it("formats days ago", () => {
		expect(formatMessageTimestamp(baseNow - 4 * 24 * 60 * 60 * 1000, baseNow)).toBe("4d ago");
	});
});
