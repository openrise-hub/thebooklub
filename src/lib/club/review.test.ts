import type { ReviewCriteriaScores } from "$lib/types/review";
import { describe, expect, it } from "vitest";
import {
	calculateAverageRating,
	calculateCriteriaAverages,
	formatRating,
	validateCriteriaScores,
	validateReview,
} from "./review";

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

	it("validates valid 5-criteria rubric scores within 1 to 5", () => {
		const validCriteria: ReviewCriteriaScores = {
			plot: 5,
			characters: 4,
			pacing: 3,
			writing: 5,
			emotion: 4,
		};
		const result = validateReview(4.5, "Loved it", validCriteria);
		expect(result.valid).toBe(true);
	});
});

describe("validateCriteriaScores", () => {
	it("accepts all 5 valid integer criteria scores from 1 to 5", () => {
		const criteria: ReviewCriteriaScores = {
			plot: 4,
			characters: 5,
			pacing: 3,
			writing: 4,
			emotion: 5,
		};
		expect(validateCriteriaScores(criteria).valid).toBe(true);
	});

	it("rejects missing or out-of-range criteria scores", () => {
		expect(
			validateCriteriaScores({
				plot: 6,
				characters: 4,
				pacing: 4,
				writing: 4,
				emotion: 4,
			}).valid,
		).toBe(false);

		expect(
			validateCriteriaScores({
				plot: 0,
				characters: 4,
				pacing: 4,
				writing: 4,
				emotion: 4,
			}).valid,
		).toBe(false);

		expect(
			validateCriteriaScores({
				plot: 4.5 as unknown as number,
				characters: 4,
				pacing: 4,
				writing: 4,
				emotion: 4,
			}).valid,
		).toBe(false);
	});
});

describe("calculateCriteriaAverages", () => {
	it("returns zeroed averages for empty review lists", () => {
		const result = calculateCriteriaAverages([]);
		expect(result).toEqual({
			plot: 0,
			characters: 0,
			pacing: 0,
			writing: 0,
			emotion: 0,
		});
	});

	it("computes accurate averages across each rubric category", () => {
		const reviews = [
			{
				criteria: {
					plot: 5,
					characters: 4,
					pacing: 3,
					writing: 5,
					emotion: 4,
				},
			},
			{
				criteria: {
					plot: 4,
					characters: 5,
					pacing: 4,
					writing: 4,
					emotion: 5,
				},
			},
		];

		const result = calculateCriteriaAverages(reviews);
		expect(result.plot).toBe(4.5);
		expect(result.characters).toBe(4.5);
		expect(result.pacing).toBe(3.5);
		expect(result.writing).toBe(4.5);
		expect(result.emotion).toBe(4.5);
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
