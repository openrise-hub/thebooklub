import {
	type CandidateBook,
	calculateSpinTargetAngle,
	calculateWheelSlices,
} from "$lib/club/roulette";
import { MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import { ROULETTE_EASING_CSS, ROULETTE_SPIN_DURATION_MS } from "$lib/constants/selection";
import { describe, expect, it } from "vitest";

const sampleCandidates: CandidateBook[] = [
	{
		id: "1",
		title: "The Hobbit",
		author: "J.R.R. Tolkien",
		totalPages: 310,
		themeColor: "purple",
		colorHex: "#46178f",
	},
	{
		id: "2",
		title: "Foundation",
		author: "Isaac Asimov",
		totalPages: 255,
		themeColor: "blue",
		colorHex: "#1368ce",
	},
	{
		id: "3",
		title: "Neuromancer",
		author: "William Gibson",
		totalPages: 271,
		themeColor: "green",
		colorHex: "#26890c",
	},
];

describe("Roulette Component Configuration & Math", () => {
	it("generates correct SVG slices for sample candidates", () => {
		const slices = calculateWheelSlices(sampleCandidates);
		expect(slices).toHaveLength(3);
		expect(slices[0].candidate.title).toBe("The Hobbit");
		expect(slices[1].candidate.title).toBe("Foundation");
		expect(slices[2].candidate.title).toBe("Neuromancer");
	});

	it("computes accurate target spin angles and rotation", () => {
		const targetAngle = calculateSpinTargetAngle(1, sampleCandidates.length, 0, 5);
		expect(targetAngle).toBeGreaterThan(1800);
		expect(typeof targetAngle).toBe("number");
	});

	it("enforces animation duration and easing constraints", () => {
		expect(ROULETTE_SPIN_DURATION_MS).toBe(5000);
		expect(ROULETTE_EASING_CSS).toBe("cubic-bezier(0.15, 0.9, 0.2, 1.0)");
		expect(MIN_CANDIDATE_BOOKS).toBe(2);
	});
});
