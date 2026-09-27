<script lang="ts">
import { type CandidateBook, assignCandidateColor } from "$lib/club/selection";
import { MAX_CANDIDATE_BOOKS, MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import Button from "./Button.svelte";

interface Props {
	candidates: CandidateBook[];
	onsearchbook?: () => void;
	onremovecandidate?: (id: string) => void;
}

let { candidates = $bindable([]), onsearchbook, onremovecandidate }: Props = $props();

const canAddMore = $derived(candidates.length < MAX_CANDIDATE_BOOKS);
const hasMinimum = $derived(candidates.length >= MIN_CANDIDATE_BOOKS);

function handleRemove(id: string) {
	candidates = candidates
		.filter((c) => c.id !== id)
		.map((c, idx) => {
			const { themeColor, colorHex } = assignCandidateColor(idx);
			return { ...c, themeColor, colorHex };
		});
	onremovecandidate?.(id);
}

function handleMoveUp(index: number) {
	if (index <= 0) return;
	const updated = [...candidates];
	const temp = updated[index - 1];
	updated[index - 1] = updated[index];
	updated[index] = temp;

	candidates = updated.map((c, idx) => {
		const { themeColor, colorHex } = assignCandidateColor(idx);
		return { ...c, themeColor, colorHex };
	});
}

function handleMoveDown(index: number) {
	if (index >= candidates.length - 1) return;
	const updated = [...candidates];
	const temp = updated[index + 1];
	updated[index + 1] = updated[index];
	updated[index] = temp;

	candidates = updated.map((c, idx) => {
		const { themeColor, colorHex } = assignCandidateColor(idx);
		return { ...c, themeColor, colorHex };
	});
}
</script>

<div class="nomination-tray" aria-label="Book Nomination Tray">
	<div class="tray-header">
		<div class="tray-title-group">
			<h3 class="tray-title">Nominated Candidates</h3>
			<span class="tray-count-badge" class:valid={hasMinimum}>
				{candidates.length} / {MAX_CANDIDATE_BOOKS} (Min {MIN_CANDIDATE_BOOKS})
			</span>
		</div>

		<Button
			variant="yellow"
			size="sm"
			disabled={!canAddMore}
			onclick={onsearchbook}
			ariaLabel="Add candidate book from search"
		>
			<span class="btn-inner">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
					<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
				</svg>
				<span>Add Candidate</span>
			</span>
		</Button>
	</div>

	{#if candidates.length === 0}
		<div class="empty-tray-state">
			<div class="empty-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
					<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
				</svg>
			</div>
			<h4 class="empty-heading">No Candidate Books Yet</h4>
			<p class="empty-sub">
				Nominate between {MIN_CANDIDATE_BOOKS} and {MAX_CANDIDATE_BOOKS} books to launch the selection roulette or poll.
			</p>
			<Button
				variant="purple"
				size="md"
				onclick={onsearchbook}
				ariaLabel="Search and add first candidate book"
			>
				Search Book Catalog
			</Button>
		</div>
	{:else}
		<div class="candidates-grid" role="list">
			{#each candidates as book, index (book.id)}
				<div
					class="candidate-card theme-{book.themeColor}"
					role="listitem"
					aria-label="{book.title} by {book.author}"
				>
					<div class="card-color-stripe" style="background-color: {book.colorHex};"></div>

					<div class="candidate-cover-box">
						{#if book.coverUrl}
							<img src={book.coverUrl} alt={book.title} class="candidate-cover-img" />
						{:else}
							<div class="candidate-cover-fallback">
								<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
									<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
								</svg>
							</div>
						{/if}
					</div>

					<div class="candidate-details">
						<div class="candidate-index-pill" style="border-color: {book.colorHex};">
							Option #{index + 1}
						</div>
						<h4 class="candidate-title">{book.title}</h4>
						<p class="candidate-author">by {book.author}</p>
						<span class="candidate-pages">{book.totalPages} pages</span>
					</div>

					<div class="candidate-actions">
						<div class="reorder-group">
							<button
								type="button"
								class="reorder-btn"
								disabled={index === 0}
								onclick={() => handleMoveUp(index)}
								aria-label="Move {book.title} up"
							>
								▲
							</button>
							<button
								type="button"
								class="reorder-btn"
								disabled={index === candidates.length - 1}
								onclick={() => handleMoveDown(index)}
								aria-label="Move {book.title} down"
							>
								▼
							</button>
						</div>

						<Button
							variant="red"
							size="sm"
							onclick={() => handleRemove(book.id)}
							ariaLabel="Remove {book.title} from nominations"
						>
							✕
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.nomination-tray {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.tray-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.tray-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.tray-title {
		font-size: 1.2rem;
		font-weight: 800;
	}

	.tray-count-badge {
		font-size: 0.78rem;
		font-weight: 800;
		padding: 4px 10px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		color: var(--color-red-base);
		box-shadow: 0 2px 0 var(--border-color);
	}

	.tray-count-badge.valid {
		color: var(--color-green-base);
	}

	.btn-inner {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.empty-tray-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 12px;
		padding: 36px 20px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 0 var(--border-color);
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: 12px;
		box-shadow: 0 3px 0 var(--border-color);
		color: var(--brand-primary);
	}

	.empty-heading {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.empty-sub {
		font-size: 0.88rem;
		color: var(--text-muted);
		max-width: 420px;
		line-height: 1.4;
	}

	.candidates-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.candidate-card {
		display: flex;
		align-items: center;
		gap: 14px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		padding: 12px 16px;
		position: relative;
		overflow: hidden;
	}

	.card-color-stripe {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
	}

	.candidate-cover-box {
		width: 48px;
		height: 68px;
		flex-shrink: 0;
	}

	.candidate-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 2px solid var(--border-color);
		border-radius: 6px;
	}

	.candidate-cover-fallback {
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

	.candidate-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.candidate-index-pill {
		display: inline-flex;
		align-self: flex-start;
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		background-color: var(--bg-surface-elevated);
		border-left: 3px solid;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.candidate-title {
		font-size: 0.95rem;
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.candidate-author {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.candidate-pages {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.candidate-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.reorder-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reorder-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 22px;
		background-color: var(--bg-surface-elevated);
		border: 1.5px solid var(--border-color);
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 900;
		color: var(--text-primary);
		cursor: pointer;
		outline: none;
	}

	.reorder-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.reorder-btn:hover:not(:disabled) {
		background-color: var(--brand-primary);
		color: #ffffff;
	}
</style>
