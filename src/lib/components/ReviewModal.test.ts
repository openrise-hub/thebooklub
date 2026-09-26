import {
	ADVANCED_CRITERIA_KEYS,
	CRITERIA_MAX_SCORE,
	CRITERIA_MIN_SCORE,
	REVIEW_COMMENT_MAX_LENGTH,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "$lib/constants/ratings";
import { describe, expect, it } from "vitest";
import {
	calculateAverageRating,
	calculateCriteriaAverages,
	formatRating,
	validateCriteriaScores,
	validateReview,
} from "../club/review";

describe("ReviewModal Ratings & Boundaries", () => {
	it("enforces star rating limits and step intervals", () => {
		expect(STAR_MIN_RATING).toBe(1.0);
		expect(STAR_MAX_RATING).toBe(5.0);
		expect(STAR_STEP_INCREMENT).toBe(0.5);
		expect(REVIEW_COMMENT_MAX_LENGTH).toBe(1000);
	});

	it("validates valid review ratings across the full 1.0 to 5.0 scale", () => {
		const validSteps = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
		for (const step of validSteps) {
			const result = validateReview(step, "Review comment");
			expect(result.valid).toBe(true);
		}
	});

	it("rejects invalid review increments and out-of-range ratings", () => {
		expect(validateReview(0.5).valid).toBe(false);
		expect(validateReview(5.5).valid).toBe(false);
		expect(validateReview(4.2).valid).toBe(false);
	});

	it("validates complete 5-criteria rubric scores within 1-5 range", () => {
		const validCriteria = {
			plot: 5,
			characters: 4,
			pacing: 4,
			writing: 5,
			emotion: 4,
		};
		expect(validateCriteriaScores(validCriteria).valid).toBe(true);
		expect(validateReview(4.5, "Great book", validCriteria).valid).toBe(true);
	});

	it("rejects invalid criteria scores outside [1, 5] range or non-integers", () => {
		expect(
			validateCriteriaScores({
				plot: 0,
				characters: 4,
				pacing: 4,
				writing: 5,
				emotion: 4,
			}).valid,
		).toBe(false);

		expect(
			validateCriteriaScores({
				plot: 6,
				characters: 4,
				pacing: 4,
				writing: 5,
				emotion: 4,
			}).valid,
		).toBe(false);

		expect(
			validateCriteriaScores({
				plot: 3.5,
				characters: 4,
				pacing: 4,
				writing: 5,
				emotion: 4,
			}).valid,
		).toBe(false);
	});

	it("formats star rating displays accurately", () => {
		expect(formatRating(4.5)).toBe("4.5");
		expect(formatRating(5)).toBe("5.0");
		expect(formatRating(1)).toBe("1.0");
	});

	it("computes average club score from submitted reviews", () => {
		const reviews = [{ rating: 5.0 }, { rating: 4.5 }, { rating: 4.0 }, { rating: 4.5 }];
		expect(calculateAverageRating(reviews)).toBe(4.5);
	});

	it("computes criteria breakdown averages across reviews", () => {
		const reviews = [
			{
				criteria: {
					plot: 5,
					characters: 5,
					pacing: 4,
					writing: 4,
					emotion: 5,
				},
			},
			{
				criteria: {
					plot: 4,
					characters: 3,
					pacing: 4,
					writing: 4,
					emotion: 3,
				},
			},
		];
		const avgs = calculateCriteriaAverages(reviews);
		expect(avgs.plot).toBe(4.5);
		expect(avgs.characters).toBe(4.0);
		expect(avgs.pacing).toBe(4.0);
		expect(avgs.writing).toBe(4.0);
		expect(avgs.emotion).toBe(4.0);
	});
});
