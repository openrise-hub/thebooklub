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

export const CRITERIA_METADATA: Record<
	AdvancedCriteriaKey,
	{ label: string; description: string }
> = {
	plot: {
		label: "Plot & Structure",
		description: "Story arc, coherence, narrative momentum, and satisfying payoff.",
	},
	characters: {
		label: "Character Development",
		description: "Depth, agency, growth, and memorable characterization.",
	},
	pacing: {
		label: "Pacing & Flow",
		description: "Reading rhythm, scene balance, and reader engagement.",
	},
	writing: {
		label: "Style & Prose",
		description: "Voice, vocabulary, descriptive imagery, and dialogue craft.",
	},
	emotion: {
		label: "Emotional Resonance",
		description: "Theme impact, empathy, thought provocation, and memorable impression.",
	},
};

export const REVIEW_COMMENT_MAX_LENGTH = 1000;
