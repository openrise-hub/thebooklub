<script lang="ts">
import {
	type PollCandidate,
	calculatePollTallies,
	determinePollWinner,
	formatPollCountdown,
} from "$lib/club/poll";
import { POLL_TICK_INTERVAL_MS } from "$lib/constants/selection";
import { onDestroy, onMount } from "svelte";
import Button from "./Button.svelte";

interface Props {
	candidates: PollCandidate[];
	endsAt: string;
	userVotedId?: string | null;
	onvote?: (candidateId: string) => Promise<void>;
	onsetactive?: (winner: PollCandidate) => void;
	onspintiebreaker?: (tied: PollCandidate[]) => void;
	disabled?: boolean;
}

let {
	candidates = [],
	endsAt,
	userVotedId = $bindable(null),
	onvote,
	onsetactive,
	onspintiebreaker,
	disabled = false,
}: Props = $props();

let isVoting = $state(false);
let voteError = $state<string | null>(null);
let now = $state(new Date());
let timerInterval: ReturnType<typeof setInterval> | null = null;

const countdown = $derived(formatPollCountdown(endsAt, now));

onMount(() => {
	now = new Date();
	timerInterval = setInterval(() => {
		now = new Date();
	}, POLL_TICK_INTERVAL_MS);
});

onDestroy(() => {
	if (timerInterval) {
		clearInterval(timerInterval);
	}
});

const isRevealed = $derived(Boolean(userVotedId) || countdown.isExpired);
const tallies = $derived(calculatePollTallies(candidates));
const pollOutcome = $derived(determinePollWinner(candidates));

async function handleVote(candidateId: string) {
	if (userVotedId || countdown.isExpired || isVoting || disabled) return;
	isVoting = true;
	voteError = null;

	try {
		if (onvote) {
			await onvote(candidateId);
		}
		userVotedId = candidateId;
	} catch (err) {
		voteError = err instanceof Error ? err.message : "Failed to record vote";
	} finally {
		isVoting = false;
	}
}
</script>

<div class="selection-poll-container" aria-label="Timed Selection Poll">
	<!-- Poll Header & Countdown Timer -->
	<div class="poll-header">
		<div class="poll-title-group">
			<h3 class="poll-heading">Club Selection Ballot</h3>
			<span class="ballot-status-badge" class:expired={countdown.isExpired}>
				{#if countdown.isExpired}
					Ballot Closed
				{:else if userVotedId}
					Vote Recorded • Secret Ballot
				{:else}
					Secret Ballot Active
				{/if}
			</span>
		</div>

		<div class="countdown-badge" class:is-closed={countdown.isExpired} aria-live="polite">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
				<circle cx="12" cy="12" r="10"/>
				<polyline points="12 6 12 12 16 14"/>
			</svg>
			<span class="countdown-text">{countdown.label}</span>
		</div>
	</div>

	{#if voteError}
		<div class="poll-error-banner" role="alert">
			{voteError}
		</div>
	{/if}

	<!-- Poll Outcome Banner (When Expired) -->
	{#if countdown.isExpired}
		<div class="outcome-banner-box">
			{#if pollOutcome.isTie}
				<div class="tie-alert-card">
					<div class="tie-header">
						<span class="tie-tag">Absolute Tie!</span>
						<h4 class="tie-title">Multiple candidates received equal top votes</h4>
					</div>
					<p class="tie-sub">
						Tied books: {pollOutcome.tiedCandidates.map((c) => `"${c.title}"`).join(", ")}
					</p>
					{#if onspintiebreaker}
						<Button
							variant="yellow"
							size="md"
							onclick={() => onspintiebreaker(pollOutcome.tiedCandidates)}
							ariaLabel="Spin tie-breaker roulette between tied books"
						>
							🎡 Spin Tie-Breaker Roulette
						</Button>
					{/if}
				</div>
			{:else if pollOutcome.winner}
				<div class="winner-alert-card">
					<div class="winner-details">
						<span class="winner-tag">Winning Book</span>
						<h4 class="winner-title">{pollOutcome.winner.title}</h4>
						<p class="winner-sub">by {pollOutcome.winner.author} • {pollOutcome.winner.votes} votes</p>
					</div>
					{#if onsetactive}
						<Button
							variant="green"
							size="md"
							onclick={() => onsetactive(pollOutcome.winner!)}
							ariaLabel="Set {pollOutcome.winner.title} as active reading cycle"
						>
							Set as Active Cycle
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Candidate Cards Grid -->
	<div class="poll-grid" role="group" aria-label="Candidate Books">
		{#each tallies as candidate (candidate.id)}
			{@const isUserChoice = userVotedId === candidate.id}
			{@const isTied = pollOutcome.isTie && pollOutcome.tiedCandidates.some((c) => c.id === candidate.id)}
			{@const isWinner = !pollOutcome.isTie && pollOutcome.winner?.id === candidate.id}

			<div
				class="poll-card"
				class:is-voted={isUserChoice}
				class:is-tied={countdown.isExpired && isTied}
				class:is-winner={countdown.isExpired && isWinner}
				style="border-left-color: {candidate.colorHex};"
			>
				<div class="card-color-stripe" style="background-color: {candidate.colorHex};"></div>

				<div class="poll-card-top">
					<div class="poll-cover-box">
						{#if candidate.coverUrl}
							<img src={candidate.coverUrl} alt={candidate.title} class="poll-cover-img" />
						{:else}
							<div class="poll-cover-fallback">
								<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
									<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
								</svg>
							</div>
						{/if}
					</div>

					<div class="poll-card-info">
						<div class="badge-row">
							<span class="option-pill" style="color: {candidate.colorHex};">
								Option
							</span>
							{#if isUserChoice}
								<span class="voted-tag">✓ Your Vote</span>
							{/if}
						</div>
						<h4 class="candidate-title">{candidate.title}</h4>
						<p class="candidate-author">by {candidate.author}</p>
						<span class="candidate-pages">{candidate.totalPages} pages</span>
					</div>
				</div>

				<!-- Vote Progress / Result Bar -->
				<div class="tally-bar-container">
					<div class="tally-labels">
						<span class="tally-label-text">
							{#if isRevealed}
								{candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}
							{:else}
								Masked
							{/if}
						</span>
						<span class="tally-percent-text">
							{#if isRevealed}
								{candidate.percent}%
							{:else}
								? %
							{/if}
						</span>
					</div>

					<div class="tally-track">
						{#if isRevealed}
							<div
								class="tally-fill"
								style="width: {candidate.percent}%; background-color: {candidate.colorHex};"
							></div>
						{:else}
							<div class="tally-masked-fill"></div>
						{/if}
					</div>
				</div>

				<!-- Action Button -->
				<div class="vote-action-wrapper">
					{#if !userVotedId && !countdown.isExpired}
						<Button
							variant="blue"
							size="md"
							fullWidth
							disabled={isVoting || disabled}
							onclick={() => handleVote(candidate.id)}
							ariaLabel="Vote for {candidate.title}"
						>
							Vote for this Book
						</Button>
					{:else if isUserChoice}
						<div class="confirmed-vote-badge">
							✓ You voted for this book
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>


<style>
	.selection-poll-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		max-width: 860px;
		margin: 0 auto;
	}

	.poll-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		padding: 14px 18px;
		box-shadow: 0 4px 0 var(--border-color);
	}

	.poll-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.poll-heading {
		font-size: 1.25rem;
		font-weight: 900;
	}

	.ballot-status-badge {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 3px 8px;
		color: var(--brand-primary);
	}

	.ballot-status-badge.expired {
		color: var(--color-red-base);
	}

	.countdown-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 6px 12px;
		box-shadow: 0 3px 0 var(--border-color);
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--color-yellow-shadow);
	}

	.countdown-badge.is-closed {
		color: var(--color-red-base);
	}

	.poll-error-banner {
		padding: 10px 14px;
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: var(--border-chunky);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-weight: 800;
	}

	.outcome-banner-box {
		width: 100%;
	}

	.tie-alert-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		background-color: #fff9e6;
		color: #1a1a1a;
		border: 3px solid #ffa602;
		border-radius: var(--radius-md);
		padding: 16px;
		box-shadow: 0 4px 0 #1a1a1a;
	}

	.tie-tag {
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		color: #b87700;
	}

	.tie-title {
		font-size: 1.1rem;
		font-weight: 900;
	}

	.tie-sub {
		font-size: 0.85rem;
		color: #5e6573;
		font-weight: 700;
	}

	.winner-alert-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 14px;
		background-color: #eaf8e6;
		color: #1a1a1a;
		border: 3px solid #26890c;
		border-radius: var(--radius-md);
		padding: 16px;
		box-shadow: 0 4px 0 #1a1a1a;
	}

	.winner-tag {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		color: #195b07;
	}

	.winner-title {
		font-size: 1.2rem;
		font-weight: 900;
	}

	.winner-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: #5e6573;
	}

	.poll-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}

	@media (min-width: 640px) {
		.poll-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.poll-card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 14px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-left-width: 6px;
		border-radius: var(--radius-md);
		padding: 16px;
		box-shadow: 0 4px 0 var(--border-color);
		overflow: hidden;
	}

	.poll-card.is-voted {
		border-color: var(--brand-primary);
		box-shadow: 0 4px 0 var(--brand-primary);
	}

	.poll-card.is-winner {
		border-color: var(--color-green-base);
		box-shadow: 0 4px 0 var(--color-green-base);
	}

	.poll-card.is-tied {
		border-color: var(--color-yellow-base);
		box-shadow: 0 4px 0 var(--color-yellow-base);
	}

	.poll-card-top {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.poll-cover-box {
		width: 52px;
		height: 76px;
		flex-shrink: 0;
	}

	.poll-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 2px solid var(--border-color);
		border-radius: 6px;
	}

	.poll-cover-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-muted);
	}

	.poll-card-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.badge-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.option-pill {
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.voted-tag {
		font-size: 0.68rem;
		font-weight: 900;
		text-transform: uppercase;
		background-color: var(--brand-primary);
		color: #ffffff;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.candidate-title {
		font-size: 1.05rem;
		font-weight: 900;
		line-height: 1.2;
		word-break: break-word;
	}

	.candidate-author {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.candidate-pages {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
	}

	.tally-bar-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.tally-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--text-muted);
	}

	.tally-track {
		height: 14px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		overflow: hidden;
	}

	.tally-fill {
		height: 100%;
		border-right: 1.5px solid var(--border-color);
		transition: width 0.3s ease;
	}

	.tally-masked-fill {
		height: 100%;
		width: 100%;
		background-color: var(--bg-surface-elevated);
		opacity: 0.5;
	}

	.vote-action-wrapper {
		width: 100%;
	}

	.confirmed-vote-badge {
		text-align: center;
		padding: 8px;
		font-size: 0.82rem;
		font-weight: 900;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		color: var(--brand-primary);
	}
</style>
