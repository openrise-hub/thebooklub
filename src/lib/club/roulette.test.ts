import { describe, expect, it } from "vitest";
import {
	type CandidateBook,
	calculateSpinTargetAngle,
	calculateWheelSlices,
	pickRandomWinnerIndex,
	polarToCartesian,
} from "./roulette";

const mockCandidates: CandidateBook[] = [
	{
		id: "b1",
		title: "Dune",
		author: "Frank Herbert",
		totalPages: 412,
		themeColor: "purple",
		colorHex: "#46178f",
	},
	{
		id: "b2",
		title: "1984",
		author: "George Orwell",
		totalPages: 328,
		themeColor: "blue",
		colorHex: "#1368ce",
	},
	{
		id: "b3",
		title: "Brave New World",
		author: "Aldous Huxley",
		totalPages: 288,
		themeColor: "green",
		colorHex: "#26890c",
	},
	{
		id: "b4",
		title: "Fahrenheit 451",
		author: "Ray Bradbury",
		totalPages: 249,
		themeColor: "yellow",
		colorHex: "#ffa602",
	},
];

describe("polarToCartesian", () => {
	it("computes cardinal points correctly from origin", () => {
		const top = polarToCartesian(0, 0, 100, 0);
		expect(Math.round(top.x)).toBe(0);
		expect(Math.round(top.y)).toBe(-100);

		const right = polarToCartesian(0, 0, 100, 90);
		expect(Math.round(right.x)).toBe(100);
		expect(Math.round(right.y)).toBe(0);

		const bottom = polarToCartesian(0, 0, 100, 180);
		expect(Math.round(bottom.x)).toBe(0);
		expect(Math.round(bottom.y)).toBe(100);
	});
});

describe("calculateWheelSlices", () => {
	it("divides 360 degrees equally across all candidates", () => {
		const slices = calculateWheelSlices(mockCandidates, 200, { x: 200, y: 200 });
		expect(slices).toHaveLength(4);

		expect(slices[0].startAngle).toBe(0);
		expect(slices[0].endAngle).toBe(90);
		expect(slices[0].midAngle).toBe(45);

		expect(slices[1].startAngle).toBe(90);
		expect(slices[1].endAngle).toBe(180);

		expect(slices[2].startAngle).toBe(180);
		expect(slices[2].endAngle).toBe(270);

		expect(slices[3].startAngle).toBe(270);
		expect(slices[3].endAngle).toBe(360);
	});

	it("returns empty array for empty candidate list", () => {
		expect(calculateWheelSlices([])).toEqual([]);
	});
});

describe("calculateSpinTargetAngle", () => {
	it("calculates forward rotational angle aligning winner slice to pointer at top", () => {
		const totalCandidates = 4; // 90 deg per slice

		// Winner index 0: center is at 45 deg. Top pointer is 0 deg. Alignment = (360 - 45) = 315 deg.
		// 5 rotations = 1800 deg. Target = 1800 + 315 = 2115 deg.
		const target0 = calculateSpinTargetAngle(0, totalCandidates, 0, 5);
		expect(target0).toBe(1800 + 315);

		// Winner index 1: center is at 135 deg. Alignment = (360 - 135) = 225 deg.
		const target1 = calculateSpinTargetAngle(1, totalCandidates, 0, 5);
		expect(target1).toBe(1800 + 225);

		// Winner index 2: center is at 225 deg. Alignment = (360 - 225) = 135 deg.
		const target2 = calculateSpinTargetAngle(2, totalCandidates, 0, 5);
		expect(target2).toBe(1800 + 135);

		// Winner index 3: center is at 315 deg. Alignment = (360 - 315) = 45 deg.
		const target3 = calculateSpinTargetAngle(3, totalCandidates, 0, 5);
		expect(target3).toBe(1800 + 45);
	});

	it("increments past existing rotation when spun repeatedly", () => {
		const target1 = calculateSpinTargetAngle(0, 4, 0, 5); // 2115
		const target2 = calculateSpinTargetAngle(0, 4, target1, 5); // next 5 rotations
		expect(target2).toBeGreaterThan(target1);
		expect(target2 % 360).toBe(target1 % 360);
	});
});

describe("pickRandomWinnerIndex", () => {
	it("returns index within candidate range", () => {
		for (let i = 0; i < 20; i++) {
			const index = pickRandomWinnerIndex(6);
			expect(index).toBeGreaterThanOrEqual(0);
			expect(index).toBeLessThan(6);
		}
	});

	it("handles zero candidates safely", () => {
		expect(pickRandomWinnerIndex(0)).toBe(0);
	});
});
