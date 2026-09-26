import {
	REVIEW_COMMENT_MAX_LENGTH,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "$lib/constants/ratings";

export interface ReviewValidationResult {
	valid: boolean;
	error?: string;
}

export function validateReview(rating: number, comment?: string): ReviewValidationResult {
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

	// Verify step increment (e.g. 0.5 increments: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)
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

export function formatRating(rating: number): string {
	if (typeof rating !== "number" || Number.isNaN(rating) || rating <= 0) {
		return "0.0";
	}
	return rating.toFixed(1);
}
