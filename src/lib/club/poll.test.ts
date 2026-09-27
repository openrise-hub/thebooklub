import { describe, expect, it } from "vitest";
import {
	type PollCandidate,
	calculatePollTallies,
	calculateVotePercentage,
	determinePollWinner,
	formatPollCountdown,
} from "./poll";

const mockPollCandidates: PollCandidate[] = [
	{
		id: "1",
		title: "Dune",
		author: "Frank Herbert",
		totalPages: 412,
		themeColor: "purple",
		colorHex: "#46178f",
		votes: 6,
	},
	{
		id: "2",
		title: "1984",
		author: "George Orwell",
		totalPages: 328,
		themeColor: "blue",
		colorHex: "#1368ce",
		votes: 4,
	},
];

describe("calculateVotePercentage", () => {
	it("computes accurate percentage for standard vote tallies", () => {
		expect(calculateVotePercentage(6, 10)).toBe(60);
		expect(calculateVotePercentage(4, 10)).toBe(40);
		expect(calculateVotePercentage(1, 3)).toBe(33);
	});

	it("safely handles zero total votes or zero individual votes", () => {
		expect(calculateVotePercentage(0, 0)).toBe(0);
		expect(calculateVotePercentage(5, 0)).toBe(0);
		expect(calculateVotePercentage(0, 10)).toBe(0);
	});
});

describe("calculatePollTallies", () => {
	it("adds percent to each candidate based on total votes", () => {
		const tallies = calculatePollTallies(mockPollCandidates);
		expect(tallies[0].percent).toBe(60);
		expect(tallies[1].percent).toBe(40);
	});

	it("handles empty candidate arrays cleanly", () => {
		expect(calculatePollTallies([])).toEqual([]);
	});
});

describe("determinePollWinner", () => {
	it("identifies single clear winner with highest votes", () => {
		const result = determinePollWinner(mockPollCandidates);
		expect(result.isTie).toBe(false);
		expect(result.winner?.title).toBe("Dune");
		expect(result.tiedCandidates).toHaveLength(1);
	});

	it("detects absolute tie when multiple candidates share top votes", () => {
		const tiedList: PollCandidate[] = [
			{ ...mockPollCandidates[0], votes: 5 },
			{ ...mockPollCandidates[1], votes: 5 },
		];

		const result = determinePollWinner(tiedList);
		expect(result.isTie).toBe(true);
		expect(result.winner).toBeNull();
		expect(result.tiedCandidates).toHaveLength(2);
		expect(result.tiedCandidates.map((c) => c.title)).toEqual(["Dune", "1984"]);
	});

	it("handles zero votes across all candidates", () => {
		const zeroList: PollCandidate[] = [
			{ ...mockPollCandidates[0], votes: 0 },
			{ ...mockPollCandidates[1], votes: 0 },
		];

		const result = determinePollWinner(zeroList);
		expect(result.isTie).toBe(false);
		expect(result.winner).toBeNull();
		expect(result.tiedCandidates).toHaveLength(0);
	});
});

describe("formatPollCountdown", () => {
	it("formats remaining hours, minutes, and seconds cleanly", () => {
		const now = new Date("2026-01-01T12:00:00Z");
		const endsAt = new Date("2026-01-01T15:30:45Z");

		const countdown = formatPollCountdown(endsAt, now);
		expect(countdown.isExpired).toBe(false);
		expect(countdown.hours).toBe(3);
		expect(countdown.minutes).toBe(30);
		expect(countdown.seconds).toBe(45);
		expect(countdown.label).toBe("3h 30m 45s remaining");
	});

	it("returns expired label when deadline is reached or passed", () => {
		const now = new Date("2026-01-01T16:00:00Z");
		const endsAt = new Date("2026-01-01T15:00:00Z");

		const countdown = formatPollCountdown(endsAt, now);
		expect(countdown.isExpired).toBe(true);
		expect(countdown.label).toBe("Ballot Closed");
	});
});
