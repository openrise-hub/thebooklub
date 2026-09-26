<script lang="ts">
import { formatRating, validateReview } from "$lib/club/review";
import {
	ADVANCED_CRITERIA_KEYS,
	type AdvancedCriteriaKey,
	CRITERIA_METADATA,
	REVIEW_COMMENT_MAX_LENGTH,
} from "$lib/constants/ratings";
import { ROUTES } from "$lib/constants/routes";
import type { Review, ReviewCriteriaScores, ReviewPostResponse } from "$lib/types/review";
import Button from "./Button.svelte";
import Modal from "./Modal.svelte";

interface Props {
	isOpen: boolean;
	clubId: string;
	cycleId: string;
	bookTitle: string;
	enableAdvancedCriteria?: boolean;
	existingRating?: number;
	existingComment?: string;
	existingCriteria?: ReviewCriteriaScores;
	onclose?: () => void;
	onsubmit?: (review: Review) => void;
}

const {
	isOpen = false,
	clubId,
	cycleId,
	bookTitle,
	enableAdvancedCriteria = false,
	existingRating = 4.0,
	existingComment = "",
	existingCriteria,
	onclose,
	onsubmit,
}: Props = $props();

let rating = $state(4.0);
let comment = $state("");
let criteria = $state<ReviewCriteriaScores>({
	plot: 4,
	characters: 4,
	pacing: 4,
	writing: 4,
	emotion: 4,
});
let isSubmitting = $state(false);
let errorMessage = $state<string | null>(null);

$effect(() => {
	if (existingRating > 0) {
		rating = existingRating;
	}
	if (existingComment) {
		comment = existingComment;
	}
	if (existingCriteria) {
		criteria = {
			plot: existingCriteria.plot ?? 4,
			characters: existingCriteria.characters ?? 4,
			pacing: existingCriteria.pacing ?? 4,
			writing: existingCriteria.writing ?? 4,
			emotion: existingCriteria.emotion ?? 4,
		};
	}
});

let charCount = $derived(comment.length);
let isOverLimit = $derived(charCount > REVIEW_COMMENT_MAX_LENGTH);

const starValues = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
const criteriaScoreSteps = [1, 2, 3, 4, 5];

function handleSelectRating(val: number) {
	rating = val;
}

function handleSetCriterion(key: AdvancedCriteriaKey, val: number) {
	criteria[key] = val;
}

async function handleSubmitReview(event: SubmitEvent) {
	event.preventDefault();
	errorMessage = null;

	const criteriaPayload = enableAdvancedCriteria ? criteria : undefined;
	const validation = validateReview(rating, comment, criteriaPayload);
	if (!validation.valid) {
		errorMessage = validation.error ?? "Invalid review";
		return;
	}

	isSubmitting = true;

	try {
		const response = await fetch(ROUTES.API_CLUB_REVIEWS(clubId), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cycleId,
				rating,
				comment: comment.trim() || undefined,
				criteria: criteriaPayload,
			}),
		});

		const data: ReviewPostResponse = await response.json();

		if (response.ok && data.success && data.review) {
			onsubmit?.(data.review);
			onclose?.();
		} else {
			errorMessage = data.error || "Failed to submit review";
		}
	} catch {
		errorMessage = "Network error while submitting review. Please retry.";
	} finally {
		isSubmitting = false;
	}
}
</script>

<Modal {isOpen} title="Rate & Review Book" {onclose}>
	{#snippet children()}
		<form id="review-modal-form" onsubmit={handleSubmitReview} class="review-form">
			<div class="book-banner">
				<span class="book-banner-label">Reviewing:</span>
				<span class="book-banner-title">{bookTitle}</span>
			</div>

			<div class="rating-picker-section">
				<span class="rating-section-title">Overall Star Rating</span>
				<div class="star-rating-row" role="radiogroup" aria-label="Book star rating">
					{#each starValues as starVal}
						<button
							type="button"
							role="radio"
							aria-checked={rating === starVal}
							class="star-step-btn"
							class:active={rating >= starVal}
							class:selected={rating === starVal}
							onclick={() => handleSelectRating(starVal)}
							aria-label="{starVal} Stars"
						>
							<span class="star-step-label">{starVal}</span>
							<span class="star-step-icon" aria-hidden="true">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
									<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
								</svg>
							</span>
						</button>
					{/each}
				</div>

				<div class="rating-display-badge">
					<span class="rating-number">{formatRating(rating)}</span>
					<span class="rating-text">/ 5.0 Stars</span>
				</div>
			</div>

			{#if enableAdvancedCriteria}
				<div class="advanced-rubric-section">
					<div class="rubric-header">
						<span class="rating-section-title">Detailed Rubric Ratings</span>
						<span class="rubric-hint">Score each dimension from 1 to 5</span>
					</div>

					<div class="criteria-grid">
						{#each ADVANCED_CRITERIA_KEYS as key}
							{@const meta = CRITERIA_METADATA[key]}
							<div class="criterion-card" role="radiogroup" aria-label="{meta.label} rating">
								<div class="criterion-top">
									<div class="criterion-titles">
										<span class="criterion-name">{meta.label}</span>
										<span class="criterion-desc">{meta.description}</span>
									</div>
									<div class="criterion-score-indicator">
										<span class="indicator-num">{criteria[key]}</span>
										<span class="indicator-max">/ 5</span>
									</div>
								</div>

								<div class="criterion-buttons">
									{#each criteriaScoreSteps as stepVal}
										<button
											type="button"
											role="radio"
											aria-checked={criteria[key] === stepVal}
											class="criterion-btn"
											class:selected={criteria[key] === stepVal}
											onclick={() => handleSetCriterion(key, stepVal)}
											aria-label="{meta.label} {stepVal} of 5"
										>
											{stepVal}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="comment-section">
				<label for="review-comment-input" class="comment-label">
					Written Review <span class="optional-tag">(Optional)</span>
				</label>
				<textarea
					id="review-comment-input"
					bind:value={comment}
					placeholder="What did you think of the plot, characters, or reading experience?"
					rows="4"
					maxlength={REVIEW_COMMENT_MAX_LENGTH + 20}
					class="comment-textarea"
					class:over-limit={isOverLimit}
				></textarea>

				<div class="comment-footer">
					<span class="char-counter" class:danger={isOverLimit}>
						{charCount} / {REVIEW_COMMENT_MAX_LENGTH}
					</span>
				</div>
			</div>

			{#if errorMessage}
				<div class="review-error-alert" role="alert">
					<span class="alert-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
						</svg>
					</span>
					<span class="alert-text">{errorMessage}</span>
				</div>
			{/if}
		</form>
	{/snippet}

	{#snippet footer()}
		<Button variant="neutral" size="md" onclick={onclose} disabled={isSubmitting}>
			Cancel
		</Button>
		<Button
			type="submit"
			form="review-modal-form"
			variant="yellow"
			size="md"
			disabled={isSubmitting || isOverLimit}
		>
			{#if isSubmitting}
				Saving Review...
			{:else}
				Submit Review &rarr;
			{/if}
		</Button>
	{/snippet}
</Modal>

<style>
	.review-form {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.book-banner {
		background-color: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		padding: 10px 14px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.book-banner-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.book-banner-title {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.rating-picker-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.rating-section-title {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.star-rating-row {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.star-step-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 8px;
		background-color: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.star-step-btn:hover {
		background-color: var(--color-yellow);
		color: #000000;
		border-color: var(--border-color);
	}

	.star-step-btn.selected {
		background-color: var(--color-yellow);
		color: #000000;
		box-shadow: 0 2px 0 var(--border-color);
		border-color: var(--border-color);
	}

	.star-step-icon {
		display: flex;
		align-items: center;
	}

	.rating-display-badge {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		padding: 4px 10px;
		width: fit-content;
	}

	.rating-number {
		font-size: 1.2rem;
		font-weight: 900;
		color: var(--color-yellow);
	}

	.rating-text {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.advanced-rubric-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 6px;
		border-top: 2px dashed var(--border-color);
	}

	.rubric-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 6px;
	}

	.rubric-hint {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.criteria-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.criterion-card {
		background-color: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.criterion-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}

	.criterion-titles {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.criterion-name {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.criterion-desc {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-muted);
		line-height: 1.2;
	}

	.criterion-score-indicator {
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
		background-color: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		padding: 1px 6px;
		flex-shrink: 0;
	}

	.indicator-num {
		font-size: 0.9rem;
		font-weight: 900;
		color: var(--text-primary);
	}

	.indicator-max {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.criterion-buttons {
		display: flex;
		gap: 6px;
	}

	.criterion-btn {
		flex: 1;
		padding: 6px 0;
		background-color: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--text-secondary);
		cursor: pointer;
		text-align: center;
		transition: all 0.1s ease;
	}

	.criterion-btn:hover {
		background-color: var(--color-blue);
		color: #ffffff;
		border-color: var(--border-color);
	}

	.criterion-btn.selected {
		background-color: var(--color-blue);
		color: #ffffff;
		box-shadow: 0 2px 0 var(--border-color);
		border-color: var(--border-color);
	}

	.comment-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.comment-label {
		font-size: 0.9rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.optional-tag {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.comment-textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		border: var(--border-chunky);
		border-radius: 6px;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: inherit;
		line-height: 1.5;
		resize: vertical;
	}

	.comment-textarea:focus {
		outline: none;
		border-color: var(--color-yellow);
	}

	.comment-textarea.over-limit {
		border-color: var(--color-red);
	}

	.comment-footer {
		display: flex;
		justify-content: flex-end;
	}

	.char-counter {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.char-counter.danger {
		color: var(--color-red);
	}

	.review-error-alert {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: #fee2e2;
		border: 2px solid var(--color-red);
		border-radius: 4px;
		color: #991b1b;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.alert-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
</style>
