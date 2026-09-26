import {
	REVIEW_COMMENT_MAX_LENGTH,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "$lib/constants/ratings";
import { describe, expect, it } from "vitest";
import { calculateAverageRating, formatRating, validateReview } from "../club/review";

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

	it("formats star rating displays accurately", () => {
		expect(formatRating(4.5)).toBe("4.5");
		expect(formatRating(5)).toBe("5.0");
		expect(formatRating(1)).toBe("1.0");
	});

	it("computes average club score from submitted reviews", () => {
		const reviews = [{ rating: 5.0 }, { rating: 4.5 }, { rating: 4.0 }, { rating: 4.5 }];
		expect(calculateAverageRating(reviews)).toBe(4.5);
	});
});
