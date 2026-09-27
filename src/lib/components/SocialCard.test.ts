import {
	DEFAULT_SOCIAL_CARD_FORMAT,
	SOCIAL_CARD_MAX_QUOTE_LENGTH,
	type SocialCardFormat,
} from "$lib/constants/social";
import { describe, expect, it } from "vitest";

function computeStars(rating: number): Array<"full" | "half" | "empty"> {
	const clamped = Math.min(5, Math.max(0, rating));
	const result: Array<"full" | "half" | "empty"> = [];
	for (let i = 1; i <= 5; i++) {
		if (clamped >= i) {
			result.push("full");
		} else if (clamped >= i - 0.5) {
			result.push("half");
		} else {
			result.push("empty");
		}
	}
	return result;
}

function processQuote(quote: string): string {
	return quote ? quote.slice(0, SOCIAL_CARD_MAX_QUOTE_LENGTH).trim() : "";
}

describe("SocialCard Logic & Formatting", () => {
	it("computes correct full, half, and empty stars for standard ratings", () => {
		expect(computeStars(5.0)).toEqual(["full", "full", "full", "full", "full"]);
		expect(computeStars(4.5)).toEqual(["full", "full", "full", "full", "half"]);
		expect(computeStars(3.0)).toEqual(["full", "full", "full", "empty", "empty"]);
		expect(computeStars(0.5)).toEqual(["half", "empty", "empty", "empty", "empty"]);
		expect(computeStars(0)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
	});

	it("clamps out-of-range ratings safely", () => {
		expect(computeStars(10.0)).toEqual(["full", "full", "full", "full", "full"]);
		expect(computeStars(-2.5)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
	});

	it("truncates quotes exceeding maximum length cleanly", () => {
		const longQuote = "a".repeat(350);
		const processed = processQuote(longQuote);
		expect(processed.length).toBe(SOCIAL_CARD_MAX_QUOTE_LENGTH);
	});

	it("handles empty quotes cleanly", () => {
		expect(processQuote("")).toBe("");
		expect(processQuote("   ")).toBe("");
	});

	it("uses default post format", () => {
		const format: SocialCardFormat = DEFAULT_SOCIAL_CARD_FORMAT;
		expect(format).toBe("post");
	});
});
