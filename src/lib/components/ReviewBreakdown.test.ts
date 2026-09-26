import {
	ADVANCED_CRITERIA_KEYS,
	CRITERIA_MAX_SCORE,
	CRITERIA_METADATA,
	CRITERIA_MIN_SCORE,
} from "$lib/constants/ratings";
import { describe, expect, it } from "vitest";
import { calculateCriteriaAverages } from "../club/review";

describe("ReviewBreakdown Rubric Constants and Calculation", () => {
	it("defines all 5 required rubric criteria with titles and descriptions", () => {
		expect(ADVANCED_CRITERIA_KEYS).toEqual(["plot", "characters", "pacing", "writing", "emotion"]);

		for (const key of ADVANCED_CRITERIA_KEYS) {
			const meta = CRITERIA_METADATA[key];
			expect(meta).toBeDefined();
			expect(meta.label.length).toBeGreaterThan(0);
			expect(meta.description.length).toBeGreaterThan(0);
		}
	});

	it("enforces criteria minimum and maximum bounds", () => {
		expect(CRITERIA_MIN_SCORE).toBe(1);
		expect(CRITERIA_MAX_SCORE).toBe(5);
	});

	it("computes accurate averages across multiple member reviews with partial criteria", () => {
		const sampleReviews = [
			{
				criteria: {
					plot: 5,
					characters: 4,
					pacing: 5,
					writing: 4,
					emotion: 5,
				},
			},
			{
				criteria: {
					plot: 3,
					characters: 4,
					pacing: 3,
					writing: 4,
					emotion: 3,
				},
			},
			{
				// Review without criteria
			},
		];

		const averages = calculateCriteriaAverages(sampleReviews);
		expect(averages.plot).toBe(4.0);
		expect(averages.characters).toBe(4.0);
		expect(averages.pacing).toBe(4.0);
		expect(averages.writing).toBe(4.0);
		expect(averages.emotion).toBe(4.0);
	});

	it("returns 0 for empty or missing reviews", () => {
		const emptyAverages = calculateCriteriaAverages([]);
		for (const key of ADVANCED_CRITERIA_KEYS) {
			expect(emptyAverages[key]).toBe(0);
		}
	});
});
