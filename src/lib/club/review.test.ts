import { describe, expect, it } from "vitest";
import { calculateAverageRating, formatRating, validateReview } from "./review";

describe("validateReview", () => {
	it("accepts valid star ratings in 0.5 increments", () => {
		expect(validateReview(1.0).valid).toBe(true);
		expect(validateReview(3.5).valid).toBe(true);
		expect(validateReview(4.0, "Great read!").valid).toBe(true);
		expect(validateReview(5.0).valid).toBe(true);
	});

	it("rejects ratings below minimum star rating (1.0)", () => {
		const result = validateReview(0.5);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("between 1 and 5");
	});

	it("rejects ratings above maximum star rating (5.0)", () => {
		const result = validateReview(5.5);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("between 1 and 5");
	});

	it("rejects ratings with invalid step increments", () => {
		const result = validateReview(3.7);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("increments of 0.5");
	});

	it("rejects non-numeric ratings", () => {
		const result = validateReview(Number.NaN);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("valid number");
	});

	it("rejects written reviews exceeding 1000 characters", () => {
		const longComment = "a".repeat(1001);
		const result = validateReview(4.0, longComment);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("cannot exceed 1000 characters");
	});
});

describe("calculateAverageRating", () => {
	it("returns 0 for empty review list", () => {
		expect(calculateAverageRating([])).toBe(0);
	});

	it("calculates accurate average rounded to one decimal place", () => {
		const reviews = [{ rating: 5 }, { rating: 4.5 }, { rating: 4 }, { rating: 3.5 }];
		expect(calculateAverageRating(reviews)).toBe(4.3);
	});

	it("calculates exact average for uniform ratings", () => {
		const reviews = [{ rating: 4.5 }, { rating: 4.5 }];
		expect(calculateAverageRating(reviews)).toBe(4.5);
	});
});

describe("formatRating", () => {
	it("formats numeric rating with one decimal point", () => {
		expect(formatRating(4.5)).toBe("4.5");
		expect(formatRating(5)).toBe("5.0");
		expect(formatRating(0)).toBe("0.0");
		expect(formatRating(Number.NaN)).toBe("0.0");
	});
});
