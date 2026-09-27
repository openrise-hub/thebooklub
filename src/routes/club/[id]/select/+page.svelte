<script lang="ts">
import {
	type CandidateBook,
	createCandidateBook,
	validateCandidateCount,
} from "$lib/club/selection";
import BookSearchModal from "$lib/components/BookSearchModal.svelte";
import Button from "$lib/components/Button.svelte";
import NominationTray from "$lib/components/NominationTray.svelte";
import { MAX_CANDIDATE_BOOKS, MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import {
	DEFAULT_POLL_HOURS,
	DEFAULT_SELECTION_MODE,
	POLL_DURATION_PRESETS_HOURS,
	type SelectionMode,
} from "$lib/constants/selection";
import type { NormalizedBook } from "$lib/types/book";
import type { PageData } from "./$types";

interface Props {
	data: PageData;
}

const { data }: Props = $props();

let selectedMode = $state<SelectionMode>(DEFAULT_SELECTION_MODE);
let pollHours = $state<number>(DEFAULT_POLL_HOURS);
let candidates = $state<CandidateBook[]>([]);
let isSearchOpen = $state(false);
let isLaunching = $state(false);
let launchError = $state<string | null>(null);
let launchSuccess = $state(false);

const candidateValidation = $derived(validateCandidateCount(candidates.length));

function handleBookSelected(book: NormalizedBook) {
	if (candidates.length >= MAX_CANDIDATE_BOOKS) return;

	const authorStr =
		book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author";

	const newCandidate = createCandidateBook(
		{
			title: book.title,
			author: authorStr,
			coverUrl: book.coverUrl ?? undefined,
			totalPages: book.pageCount || 100,
		},
		candidates.length,
	);

	candidates = [...candidates, newCandidate];
	isSearchOpen = false;
	launchError = null;
}

async function handleLaunch() {
	if (!candidateValidation.valid) {
		launchError = candidateValidation.error || "Invalid candidate count";
		return;
	}

	isLaunching = true;
	launchError = null;

	try {
		const res = await fetch(`/api/club/${data.clubId}/selection`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				mode: selectedMode,
				candidates,
				pollDurationHours: selectedMode === "poll" ? pollHours : undefined,
			}),
		});

		const result = await res.json();
		if (!res.ok || !result.success) {
			launchError = result.error || "Failed to launch selection session";
		} else {
			launchSuccess = true;
		}
	} catch (err) {
		launchError = err instanceof Error ? err.message : "Network error occurred";
	} finally {
		isLaunching = false;
	}
}
</script>

<svelte:head>
	<title>Book Selection Hub • {data.club.name}</title>
</svelte:head>

<div class="selection-page-wrapper">
	<header class="selection-hub-header">
		<div class="header-breadcrumbs">
			<a href="/club/{data.clubId}" class="back-link">
				← Return to Dashboard
			</a>
		</div>

		<h1 class="hub-title">Book Selection Hub</h1>
		<p class="hub-sub">
			Nominate titles and choose how your club will pick the next read: synchronous arcade roulette or a timed ballot poll.
		</p>
	</header>

	<main class="selection-main-grid">
		<!-- Left Column: Mode & Configuration -->
		<section class="selection-config-card">
			<h2 class="section-heading">1. Choose Selection Mode</h2>

			<div class="mode-selector-grid" role="radiogroup" aria-label="Selection Mode">
				<button
					type="button"
					class="mode-card"
					class:selected={selectedMode === "roulette"}
					onclick={() => (selectedMode = "roulette")}
					role="radio"
					aria-checked={selectedMode === "roulette"}
				>
					<div class="mode-icon roulette-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
						</svg>
					</div>
					<div class="mode-text">
						<h3 class="mode-title">Mode A: Roulette Wheel</h3>
						<p class="mode-desc">Live synchronized spinning wheel with instant arcade winner reveal.</p>
					</div>
				</button>

				<button
					type="button"
					class="mode-card"
					class:selected={selectedMode === "poll"}
					onclick={() => (selectedMode = "poll")}
					role="radio"
					aria-checked={selectedMode === "poll"}
				>
					<div class="mode-icon poll-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
							<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
						</svg>
					</div>
					<div class="mode-text">
						<h3 class="mode-title">Mode B: Timed Ballot Poll</h3>
						<p class="mode-desc">Secret ballot voting with live countdown timer and masked vote tallies.</p>
					</div>
				</button>
			</div>

			<!-- Poll Duration Settings -->
			{#if selectedMode === "poll"}
				<div class="poll-settings-box">
					<h3 class="subsection-heading">Voting Duration</h3>
					<div class="duration-presets-row">
						{#each POLL_DURATION_PRESETS_HOURS as hours}
							<button
								type="button"
								class="preset-btn"
								class:active={pollHours === hours}
								onclick={() => (pollHours = hours)}
							>
								{hours}h
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Launch Action -->
			<div class="launch-action-section">
				{#if launchError}
					<div class="error-banner" role="alert">
						{launchError}
					</div>
				{/if}

				{#if launchSuccess}
					<div class="success-banner" role="status">
						✓ {selectedMode === "roulette" ? "Roulette Wheel" : "Timed Ballot"} session initiated successfully!
					</div>
				{/if}

				<Button
					variant={selectedMode === "roulette" ? "purple" : "blue"}
					size="lg"
					fullWidth
					disabled={!candidateValidation.valid || isLaunching}
					onclick={handleLaunch}
					ariaLabel="Launch {selectedMode === 'roulette' ? 'Roulette Wheel' : 'Timed Ballot'}"
				>
					{#if isLaunching}
						<span>Launching...</span>
					{:else}
						<span>
							Launch {selectedMode === "roulette" ? "Roulette Wheel" : "Timed Ballot"} ({candidates.length} Books)
						</span>
					{/if}
				</Button>
			</div>
		</section>

		<!-- Right Column: Nomination Tray -->
		<section class="nomination-tray-section">
			<h2 class="section-heading">2. Nominate Candidate Books</h2>

			<NominationTray
				bind:candidates
				onsearchbook={() => (isSearchOpen = true)}
			/>
		</section>
	</main>
</div>

<!-- Search Modal -->
<BookSearchModal
	isOpen={isSearchOpen}
	onclose={() => (isSearchOpen = false)}
	onselect={handleBookSelected}
/>

<style>
	.selection-page-wrapper {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 1040px;
		margin: 0 auto;
		padding: 24px 16px;
	}

	.selection-hub-header {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.back-link {
		display: inline-flex;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--brand-primary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.hub-title {
		font-size: 1.85rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.hub-sub {
		font-size: 0.95rem;
		color: var(--text-muted);
		max-width: 640px;
		line-height: 1.4;
	}

	.selection-main-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	@media (min-width: 800px) {
		.selection-main-grid {
			grid-template-columns: 1fr 1.1fr;
		}
	}

	.section-heading {
		font-size: 1.15rem;
		font-weight: 800;
		margin-bottom: 12px;
	}

	.selection-config-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 0 var(--border-color);
		padding: 20px;
		height: fit-content;
	}

	.mode-selector-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mode-card {
		display: flex;
		align-items: center;
		gap: 14px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: var(--radius-md);
		box-shadow: 0 3px 0 var(--border-color);
		padding: 14px;
		text-align: left;
		cursor: pointer;
		transition: transform 0.1s ease, border-color 0.1s ease;
	}

	.mode-card.selected {
		border-color: var(--brand-primary);
		box-shadow: 0 4px 0 var(--brand-primary);
		transform: translateY(-2px);
	}

	.mode-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 2px solid var(--border-color);
		border-radius: 10px;
		flex-shrink: 0;
		color: #ffffff;
	}

	.roulette-icon {
		background-color: var(--brand-primary);
	}

	.poll-icon {
		background-color: var(--color-blue-base);
	}

	.mode-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.mode-title {
		font-size: 0.95rem;
		font-weight: 800;
	}

	.mode-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.poll-settings-box {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
	}

	.subsection-heading {
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}

	.duration-presets-row {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.preset-btn {
		padding: 6px 12px;
		background-color: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.8rem;
		cursor: pointer;
		box-shadow: 0 2px 0 var(--border-color);
	}

	.preset-btn.active {
		background-color: var(--color-blue-base);
		color: #ffffff;
	}

	.launch-action-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.error-banner {
		padding: 8px 12px;
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.success-banner {
		padding: 8px 12px;
		background-color: var(--color-green-base);
		color: var(--color-green-text);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.nomination-tray-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
