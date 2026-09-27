import {
	type PollCandidate,
	calculatePollTallies,
	determinePollWinner,
	formatPollCountdown,
} from "$lib/club/poll";
import { describe, expect, it } from "vitest";

const samplePollCandidates: PollCandidate[] = [
	{
		id: "1",
		title: "Hyperion",
		author: "Dan Simmons",
		totalPages: 482,
		themeColor: "purple",
		colorHex: "#46178f",
		votes: 7,
	},
	{
		id: "2",
		title: "Snow Crash",
		author: "Neal Stephenson",
		totalPages: 440,
		themeColor: "blue",
		colorHex: "#1368ce",
		votes: 3,
	},
];

describe("SelectionPoll Component Logic", () => {
	it("calculates accurate percentage distributions for secret ballot reveal", () => {
		const tallies = calculatePollTallies(samplePollCandidates);
		expect(tallies[0].percent).toBe(70);
		expect(tallies[1].percent).toBe(30);
	});

	it("identifies winner correctly upon poll completion", () => {
		const outcome = determinePollWinner(samplePollCandidates);
		expect(outcome.isTie).toBe(false);
		expect(outcome.winner?.title).toBe("Hyperion");
	});

	it("identifies tied candidates when votes are equal", () => {
		const tied: PollCandidate[] = [
			{ ...samplePollCandidates[0], votes: 5 },
			{ ...samplePollCandidates[1], votes: 5 },
		];

		const outcome = determinePollWinner(tied);
		expect(outcome.isTie).toBe(true);
		expect(outcome.winner).toBeNull();
		expect(outcome.tiedCandidates).toHaveLength(2);
	});

	it("formats countdown timer text correctly", () => {
		const future = new Date(Date.now() + 3600 * 1000);
		const cd = formatPollCountdown(future);
		expect(cd.isExpired).toBe(false);
		expect(cd.label).toContain("remaining");
	});
});
