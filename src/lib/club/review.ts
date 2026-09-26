import {
	ADVANCED_CRITERIA_KEYS,
	type AdvancedCriteriaKey,
	CRITERIA_MAX_SCORE,
	CRITERIA_MIN_SCORE,
	REVIEW_COMMENT_MAX_LENGTH,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "$lib/constants/ratings";
import type { ReviewCriteriaScores } from "$lib/types/review";

export interface ReviewValidationResult {
	valid: boolean;
	error?: string;
}

export function validateCriteriaScores(
	criteria: Partial<ReviewCriteriaScores>,
): ReviewValidationResult {
	for (const key of ADVANCED_CRITERIA_KEYS) {
		const score = criteria[key];
		if (
			typeof score !== "number" ||
			Number.isNaN(score) ||
			!Number.isInteger(score) ||
			score < CRITERIA_MIN_SCORE ||
			score > CRITERIA_MAX_SCORE
		) {
			return {
				valid: false,
				error: `Score for ${key} must be an integer between ${CRITERIA_MIN_SCORE} and ${CRITERIA_MAX_SCORE}`,
			};
		}
	}

	return { valid: true };
}

export function validateReview(
	rating: number,
	comment?: string,
	criteria?: ReviewCriteriaScores,
): ReviewValidationResult {
	if (typeof rating !== "number" || Number.isNaN(rating) || !Number.isFinite(rating)) {
		return {
			valid: false,
			error: "Star rating must be a valid number",
		};
	}

	if (rating < STAR_MIN_RATING || rating > STAR_MAX_RATING) {
		return {
			valid: false,
			error: `Rating must be between ${STAR_MIN_RATING} and ${STAR_MAX_RATING} stars`,
		};
	}

	const remainder = Math.round((rating / STAR_STEP_INCREMENT) * 100) % 100;
	if (remainder !== 0) {
		return {
			valid: false,
			error: `Rating must be in increments of ${STAR_STEP_INCREMENT} stars`,
		};
	}

	if (comment && comment.trim().length > REVIEW_COMMENT_MAX_LENGTH) {
		return {
			valid: false,
			error: `Written review cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters`,
		};
	}

	if (criteria) {
		const criteriaValidation = validateCriteriaScores(criteria);
		if (!criteriaValidation.valid) {
			return criteriaValidation;
		}
	}

	return { valid: true };
}

export function calculateAverageRating(reviews: Array<{ rating: number }>): number {
	if (!reviews || reviews.length === 0) {
		return 0;
	}

	const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
	const avg = sum / reviews.length;
	return Math.round(avg * 10) / 10;
}

export function calculateCriteriaAverages(
	reviews: Array<{ criteria?: ReviewCriteriaScores }>,
): Record<AdvancedCriteriaKey, number> {
	const result: Record<AdvancedCriteriaKey, number> = {
		plot: 0,
		characters: 0,
		pacing: 0,
		writing: 0,
		emotion: 0,
	};

	if (!reviews || reviews.length === 0) {
		return result;
	}

	for (const key of ADVANCED_CRITERIA_KEYS) {
		let total = 0;
		let count = 0;

		for (const r of reviews) {
			if (r.criteria && typeof r.criteria[key] === "number" && r.criteria[key] > 0) {
				total += r.criteria[key];
				count++;
			}
		}

		result[key] = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
	}

	return result;
}

export function formatRating(rating: number): string {
	if (typeof rating !== "number" || Number.isNaN(rating) || rating <= 0) {
		return "0.0";
	}
	return rating.toFixed(1);
}
