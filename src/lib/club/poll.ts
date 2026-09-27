export interface PollCandidate {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	totalPages: number;
	themeColor: string;
	colorHex: string;
	votes: number;
}

export interface PollState {
	id: string;
	clubId: string;
	endsAt: string;
	totalVotes: number;
	candidates: PollCandidate[];
	userVotedCandidateId?: string | null;
	isExpired: boolean;
}

export function calculateVotePercentage(votes: number, totalVotes: number): number {
	if (totalVotes <= 0 || Number.isNaN(totalVotes)) return 0;
	if (votes <= 0 || Number.isNaN(votes)) return 0;
	const ratio = (votes / totalVotes) * 100;
	return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function calculatePollTallies(
	candidates: PollCandidate[],
): Array<PollCandidate & { percent: number }> {
	if (!candidates || candidates.length === 0) return [];

	const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

	return candidates.map((c) => ({
		...c,
		percent: calculateVotePercentage(c.votes || 0, totalVotes),
	}));
}

export function determinePollWinner(candidates: PollCandidate[]): {
	winner: PollCandidate | null;
	isTie: boolean;
	tiedCandidates: PollCandidate[];
} {
	if (!candidates || candidates.length === 0) {
		return { winner: null, isTie: false, tiedCandidates: [] };
	}

	const maxVotes = Math.max(...candidates.map((c) => c.votes || 0));
	if (maxVotes === 0) {
		return { winner: null, isTie: false, tiedCandidates: [] };
	}

	const topCandidates = candidates.filter((c) => (c.votes || 0) === maxVotes);

	if (topCandidates.length > 1) {
		return {
			winner: null,
			isTie: true,
			tiedCandidates: topCandidates,
		};
	}

	return {
		winner: topCandidates[0] || null,
		isTie: false,
		tiedCandidates: topCandidates,
	};
}

export function formatPollCountdown(
	endsAt: string | Date,
	now: Date = new Date(),
): {
	label: string;
	isExpired: boolean;
	hours: number;
	minutes: number;
	seconds: number;
} {
	const endMs = new Date(endsAt).getTime();
	const nowMs = now.getTime();
	const totalMs = Math.max(0, endMs - nowMs);
	const isExpired = totalMs <= 0;

	if (isExpired) {
		return {
			label: "Ballot Closed",
			isExpired: true,
			hours: 0,
			minutes: 0,
			seconds: 0,
		};
	}

	const totalSeconds = Math.floor(totalMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (n: number) => n.toString().padStart(2, "0");
	const label = `${hours}h ${pad(minutes)}m ${pad(seconds)}s remaining`;

	return { label, isExpired: false, hours, minutes, seconds };
}
