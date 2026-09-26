import { isSpoiler } from "$lib/club/discussion";
import { describe, expect, it } from "vitest";

describe("SpoilerText Evaluation Logic", () => {
	it("identifies non-spoiler messages for past or current pages", () => {
		expect(isSpoiler(10, 50)).toBe(false);
		expect(isSpoiler(50, 50)).toBe(false);
	});

	it("identifies non-spoiler messages for general book-wide thoughts (page 0)", () => {
		expect(isSpoiler(0, 50)).toBe(false);
		expect(isSpoiler(0, 0)).toBe(false);
	});

	it("identifies spoiler messages ahead of user reading progress", () => {
		expect(isSpoiler(51, 50)).toBe(true);
		expect(isSpoiler(150, 42)).toBe(true);
		expect(isSpoiler(1, 0)).toBe(true);
	});

	it("evaluates dynamic unblur state when user advances reading page", () => {
		const messagePage = 75;
		let userPage = 40;

		// Initially ahead of user -> spoiler
		expect(isSpoiler(messagePage, userPage)).toBe(true);

		// User reads further to page 75 -> no longer spoiler
		userPage = 75;
		expect(isSpoiler(messagePage, userPage)).toBe(false);

		// User finishes book on page 200 -> no longer spoiler
		userPage = 200;
		expect(isSpoiler(messagePage, userPage)).toBe(false);
	});

	it("maintains correct manual reveal state transitions", () => {
		const messagePage = 100;
		const userPage = 50;
		const hasSpoiler = isSpoiler(messagePage, userPage);
		expect(hasSpoiler).toBe(true);

		// Initial state: not manually revealed -> obscured
		let isManuallyRevealed = false;
		let isObscured = hasSpoiler && !isManuallyRevealed;
		expect(isObscured).toBe(true);

		// User clicks to reveal -> unobscured
		isManuallyRevealed = true;
		isObscured = hasSpoiler && !isManuallyRevealed;
		expect(isObscured).toBe(false);

		// User toggles to hide -> obscured again
		isManuallyRevealed = false;
		isObscured = hasSpoiler && !isManuallyRevealed;
		expect(isObscured).toBe(true);
	});
});
