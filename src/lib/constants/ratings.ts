/**
 * Centralized rating criteria and star rating constants.
 * Avoids magic numbers in standard and advanced review systems.
 */

export const STAR_MIN_RATING = 1.0;
export const STAR_MAX_RATING = 5.0;
export const STAR_STEP_INCREMENT = 0.5;

export const ADVANCED_CRITERIA_KEYS = [
	"plot",
	"characters",
	"pacing",
	"writing",
	"emotion",
] as const;

export type AdvancedCriteriaKey = (typeof ADVANCED_CRITERIA_KEYS)[number];

export const CRITERIA_MIN_SCORE = 1;
export const CRITERIA_MAX_SCORE = 5;
