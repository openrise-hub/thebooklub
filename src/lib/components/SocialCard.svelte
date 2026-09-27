<script lang="ts">
import {
	DEFAULT_SOCIAL_CARD_FORMAT,
	SOCIAL_CARD_MAX_QUOTE_LENGTH,
	type SocialCardFormat,
} from "$lib/constants/social";
import { exportSocialCard } from "$lib/utils/social";
import Button from "./Button.svelte";

interface Props {
	clubName: string;
	bookTitle: string;
	bookAuthor: string;
	coverUrl?: string;
	rating?: number;
	quote?: string;
	format?: SocialCardFormat;
	showControls?: boolean;
	cardTheme?: "purple" | "blue" | "green" | "yellow" | "red";
	onexported?: () => void;
}

let {
	clubName,
	bookTitle,
	bookAuthor,
	coverUrl = "",
	rating = 5,
	quote = "",
	format = $bindable(DEFAULT_SOCIAL_CARD_FORMAT),
	showControls = true,
	cardTheme = "purple",
	onexported,
}: Props = $props();

let isExporting = $state(false);

let exportError = $state<string | null>(null);
let imageLoadFailed = $state(false);
let cardRef = $state<HTMLElement | null>(null);

const displayQuote = $derived(quote ? quote.slice(0, SOCIAL_CARD_MAX_QUOTE_LENGTH).trim() : "");

const clampedRating = $derived(
	typeof rating === "number" && !Number.isNaN(rating) ? Math.min(5, Math.max(0, rating)) : 0,
);

const stars = $derived.by(() => {
	const result: Array<"full" | "half" | "empty"> = [];
	for (let i = 1; i <= 5; i++) {
		if (clampedRating >= i) {
			result.push("full");
		} else if (clampedRating >= i - 0.5) {
			result.push("half");
		} else {
			result.push("empty");
		}
	}
	return result;
});

function handleImageError() {
	imageLoadFailed = true;
}

async function handleDownload() {
	if (!cardRef || isExporting) return;
	isExporting = true;
	exportError = null;

	try {
		await exportSocialCard(cardRef, clubName, bookTitle, format);
		onexported?.();
	} catch (err) {
		exportError = err instanceof Error ? err.message : "Failed to export social card";
	} finally {
		isExporting = false;
	}
}
</script>

<div class="social-card-container">
	{#if showControls}
		<div class="controls-toolbar" aria-label="Social card controls">
			<div class="format-toggle-group" role="group" aria-label="Card format">
				<button
					type="button"
					class="format-btn"
					class:active={format === "post"}
					onclick={() => (format = "post")}
					aria-pressed={format === "post"}
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
						<rect x="3" y="3" width="18" height="18" rx="3"/>
					</svg>
					<span>Post (1:1)</span>
				</button>
				<button
					type="button"
					class="format-btn"
					class:active={format === "story"}
					onclick={() => (format = "story")}
					aria-pressed={format === "story"}
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
						<rect x="5" y="2" width="14" height="20" rx="3"/>
					</svg>
					<span>Story (9:16)</span>
				</button>
			</div>

			<Button
				variant="yellow"
				size="sm"
				disabled={isExporting}
				onclick={handleDownload}
				ariaLabel="Download shareable PNG card"
			>
				{#if isExporting}
					<span class="btn-content">
						<svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
							<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"/>
						</svg>
						<span>Generating...</span>
					</span>
				{:else}
					<span class="btn-content">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
						</svg>
						<span>Download PNG</span>
					</span>
				{/if}
			</Button>
		</div>

		{#if exportError}
			<div class="error-banner" role="alert">
				{exportError}
			</div>
		{/if}
	{/if}

	<div class="card-preview-viewport">
		<div
			bind:this={cardRef}
			class="social-card-artboard format-{format} theme-{cardTheme}"
			data-testid="social-card-artboard"
		>
			<!-- Card Header / Club Tag -->
			<div class="card-header">
				<div class="club-badge">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
					</svg>
					<span class="club-name-text">{clubName}</span>
				</div>
				<span class="app-tag">The Book Club</span>
			</div>

			<!-- Main Book Presentation -->
			<div class="book-showcase">
				<div class="cover-wrapper">
					{#if coverUrl && !imageLoadFailed}
						<img
							src={coverUrl}
							alt={bookTitle}
							class="book-cover-img"
							onerror={handleImageError}
							crossorigin="anonymous"
						/>
					{:else}
						<div class="cover-fallback" data-testid="cover-fallback">
							<div class="fallback-spine"></div>
							<div class="fallback-content">
								<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
									<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
								</svg>
								<span class="fallback-title">{bookTitle}</span>
								<span class="fallback-author">{bookAuthor}</span>
							</div>
						</div>
					{/if}
				</div>

				<div class="book-details">
					<h2 class="card-book-title">{bookTitle}</h2>
					<p class="card-book-author">by {bookAuthor}</p>

					<div class="rating-strip" aria-label="Rating: {clampedRating} out of 5 stars">
						<div class="stars-row">
							{#each stars as starType, i (i)}
								<span class="star-icon star-{starType}" aria-hidden="true">
									{#if starType === "full"}
										<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
											<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
										</svg>
									{:else if starType === "half"}
										<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
											<path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
										</svg>
									{:else}
										<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
										</svg>
									{/if}
								</span>
							{/each}
						</div>
						<span class="rating-number">{clampedRating.toFixed(1)} / 5.0</span>
					</div>
				</div>
			</div>

			<!-- Quote or Review Snippet -->
			{#if displayQuote}
				<div class="quote-container">
					<div class="quote-mark" aria-hidden="true">“</div>
					<p class="quote-text">{displayQuote}</p>
				</div>
			{/if}

			<!-- Card Footer -->
			<div class="card-footer">
				<span class="footer-prompt">Join the discussion at</span>
				<span class="footer-brand">thebookclub.app</span>
			</div>
		</div>
	</div>
</div>

<style>
	.social-card-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		max-width: 540px;
		margin: 0 auto;
	}

	.controls-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		padding: 12px 16px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
	}

	.format-toggle-group {
		display: inline-flex;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 3px;
		gap: 4px;
	}

	.format-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.format-btn.active {
		background-color: var(--brand-primary);
		color: #ffffff;
		box-shadow: 0 2px 0 var(--border-color);
	}

	.btn-content {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.error-banner {
		padding: 10px 14px;
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: var(--border-chunky);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.card-preview-viewport {
		display: flex;
		justify-content: center;
		width: 100%;
		overflow: hidden;
		background-color: var(--bg-surface-elevated);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		padding: 24px;
	}

	/* ARTBOARD */
	.social-card-artboard {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
		box-sizing: border-box;
		border: 4px solid #1a1a1a;
		border-radius: 20px;
		box-shadow: 0 8px 0 #1a1a1a;
		overflow: hidden;
		color: #ffffff;
		padding: 24px;
		user-select: none;
	}

	/* Formats */
	.social-card-artboard.format-post {
		aspect-ratio: 1 / 1;
		max-width: 440px;
	}

	.social-card-artboard.format-story {
		aspect-ratio: 9 / 16;
		max-width: 380px;
		padding: 32px 24px;
	}

	/* Themes (100% Solid Vibrant Colors) */
	.theme-purple {
		background-color: #46178f;
	}

	.theme-blue {
		background-color: #1368ce;
	}

	.theme-green {
		background-color: #26890c;
	}

	.theme-yellow {
		background-color: #ffa602;
		color: #1a1a1a;
	}

	.theme-yellow .social-card-artboard {
		color: #1a1a1a;
	}

	.theme-red {
		background-color: #e21b3c;
	}

	/* Card Elements */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.club-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background-color: #ffffff;
		color: #1a1a1a;
		border: 2.5px solid #1a1a1a;
		border-radius: 8px;
		padding: 4px 10px;
		font-weight: 800;
		font-size: 0.8rem;
		box-shadow: 0 3px 0 #1a1a1a;
	}

	.app-tag {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.9;
	}

	.book-showcase {
		display: flex;
		gap: 18px;
		align-items: center;
		margin: 12px 0;
	}

	.format-story .book-showcase {
		flex-direction: column;
		text-align: center;
		margin: 20px 0;
	}

	.cover-wrapper {
		flex-shrink: 0;
	}

	.book-cover-img {
		width: 110px;
		height: 160px;
		object-fit: cover;
		border: 3.5px solid #1a1a1a;
		border-radius: 10px;
		box-shadow: 0 5px 0 #1a1a1a;
		display: block;
	}

	.format-story .book-cover-img {
		width: 140px;
		height: 205px;
	}

	.cover-fallback {
		width: 110px;
		height: 160px;
		background-color: #ffffff;
		color: #1a1a1a;
		border: 3.5px solid #1a1a1a;
		border-radius: 10px;
		box-shadow: 0 5px 0 #1a1a1a;
		display: flex;
		position: relative;
		overflow: hidden;
	}

	.format-story .cover-fallback {
		width: 140px;
		height: 205px;
	}

	.fallback-spine {
		width: 12px;
		background-color: #ffa602;
		border-right: 2px solid #1a1a1a;
		height: 100%;
	}

	.fallback-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px 6px;
		text-align: center;
		gap: 4px;
	}

	.fallback-title {
		font-size: 0.75rem;
		font-weight: 800;
		line-height: 1.1;
		word-break: break-word;
	}

	.fallback-author {
		font-size: 0.65rem;
		font-weight: 700;
		color: #5e6573;
	}

	.book-details {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.card-book-title {
		font-size: 1.3rem;
		font-weight: 900;
		line-height: 1.15;
		letter-spacing: -0.01em;
		word-break: break-word;
	}

	.format-story .card-book-title {
		font-size: 1.45rem;
	}

	.card-book-author {
		font-size: 0.9rem;
		font-weight: 700;
		opacity: 0.9;
	}

	.rating-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.format-story .rating-strip {
		justify-content: center;
	}

	.stars-row {
		display: inline-flex;
		gap: 2px;
		color: #ffa602;
	}

	.star-empty {
		opacity: 0.4;
	}

	.rating-number {
		font-size: 0.85rem;
		font-weight: 800;
	}

	.quote-container {
		position: relative;
		background-color: rgba(255, 255, 255, 0.95);
		color: #1a1a1a;
		border: 3px solid #1a1a1a;
		border-radius: 12px;
		padding: 12px 16px;
		box-shadow: 0 4px 0 #1a1a1a;
		margin: 8px 0;
	}

	.quote-mark {
		position: absolute;
		top: -10px;
		left: 10px;
		font-size: 2.2rem;
		font-family: serif;
		font-weight: 900;
		line-height: 1;
		color: #ffa602;
	}

	.quote-text {
		font-size: 0.85rem;
		font-weight: 700;
		line-height: 1.35;
		font-style: italic;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 2px solid rgba(255, 255, 255, 0.3);
		padding-top: 10px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.theme-yellow .card-footer {
		border-top-color: rgba(0, 0, 0, 0.2);
	}

	.footer-brand {
		font-weight: 900;
		letter-spacing: 0.04em;
	}

	@media (max-width: 480px) {
		.social-card-artboard.format-post {
			padding: 16px;
		}

		.card-book-title {
			font-size: 1.1rem;
		}

		.book-cover-img,
		.cover-fallback {
			width: 90px;
			height: 130px;
		}
	}
</style>
