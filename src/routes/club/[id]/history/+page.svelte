<script lang="ts">
import Button from "$lib/components/Button.svelte";
import Card from "$lib/components/Card.svelte";
import LanguageSwitch from "$lib/components/LanguageSwitch.svelte";
import Modal from "$lib/components/Modal.svelte";
import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
import { CRITERIA_MAX_SCORE, STAR_MAX_RATING } from "$lib/constants/ratings";
import { ROUTES } from "$lib/constants/routes";
import { t } from "$lib/i18n";
import type { ArchivedReadingCycle } from "$lib/types/cycle";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let selectedCycleForReviews = $state<ArchivedReadingCycle | null>(null);
let selectedCycleForDiscussions = $state<ArchivedReadingCycle | null>(null);

let totalBooksRead = $derived(data.pastCycles.length);

let averageClubScore = $derived.by(() => {
	if (data.pastCycles.length === 0) return 0;
	const sum = data.pastCycles.reduce((acc, cycle) => acc + (cycle.averageRating ?? 0), 0);
	return Number((sum / data.pastCycles.length).toFixed(1));
});

let totalArchivedReviews = $derived.by(() => {
	return data.pastCycles.reduce((acc, cycle) => acc + (cycle.totalReviews ?? 0), 0);
});

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});
}

function formatDateRange(startDate: number, endDate: number): string {
	return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function openReviewsModal(cycle: ArchivedReadingCycle) {
	selectedCycleForReviews = cycle;
}

function closeReviewsModal() {
	selectedCycleForReviews = null;
}

function openDiscussionsModal(cycle: ArchivedReadingCycle) {
	selectedCycleForDiscussions = cycle;
}

function closeDiscussionsModal() {
	selectedCycleForDiscussions = null;
}
</script>

<svelte:head>
	<title>{data.club.name} - {t("history_title")}</title>
</svelte:head>

<div class="history-page">
	<header class="history-header">
		<div class="header-container">
			<div class="header-left">
				<a href={ROUTES.CLUB_DASHBOARD(data.club.id)} class="back-link">
					<Button variant="neutral" size="sm">
						&larr; {t("history_back_to_club")}
					</Button>
				</a>
				<div class="club-title-group">
					<h1 class="club-name">{data.club.name}</h1>
					<span class="badge history-badge">{t("history_title")}</span>
				</div>
			</div>

			<div class="header-right">
				<LanguageSwitch />
				<ThemeSwitch />
			</div>
		</div>
	</header>

	<main id="main-content" class="history-main" tabindex="-1">
		<div class="history-content">
			<div class="page-intro">
				<div class="intro-text-group">
					<h2 class="page-title">Past Reading Cycles</h2>
					<p class="page-subtitle">
						Explore past completed books, member reviews, rubrics, and discussion logs in read-only archive mode.
					</p>
				</div>

				{#if data.pastCycles.length > 0}
					<div class="stats-ribbon">
						<div class="stat-card">
							<span class="stat-value">{totalBooksRead}</span>
							<span class="stat-label">Books Read</span>
						</div>
						<div class="stat-card">
							<span class="stat-value star-stat">
								<svg class="star-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
								{averageClubScore}
							</span>
							<span class="stat-label">Avg Rating</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">{totalArchivedReviews}</span>
							<span class="stat-label">Reviews</span>
						</div>
					</div>
				{/if}
			</div>

			{#if data.pastCycles.length === 0}
				<Card padding="lg" class="empty-state-card">
					<div class="empty-state-content">
						<div class="empty-icon-box" aria-hidden="true">
							<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
						</div>
						<h3 class="empty-title">No Completed Cycles Yet</h3>
						<p class="empty-description">
							Once your club finishes its active reading cycle, past books, community ratings, and full discussion archives will be preserved here permanently.
						</p>
						<a href={ROUTES.CLUB_DASHBOARD(data.club.id)}>
							<Button variant="purple" size="md">
								Go to Active Dashboard
							</Button>
						</a>
					</div>
				</Card>
			{:else}
				<div class="cycles-list">
					{#each data.pastCycles as cycle (cycle.id)}
						<Card padding="lg" class="cycle-archive-card">
							<div class="cycle-layout">
								<div class="cover-container">
									{#if cycle.book.coverUrl}
										<img
											src={cycle.book.coverUrl}
											alt={cycle.book.title}
											class="cover-image"
										/>
									{:else}
										<div class="cover-placeholder" aria-hidden="true">
											<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
										</div>
									{/if}
								</div>

								<div class="cycle-details">
									<div class="cycle-badges">
										<span class="badge cadence-tag">
											{cycle.cadence} cycle
										</span>
										<span class="badge status-tag" class:purged={cycle.status === "purged"}>
											{cycle.status === "purged" ? "PDF Purged" : "Completed"}
										</span>
										<span class="badge date-tag">
											{formatDateRange(cycle.startDate, cycle.endDate)}
										</span>
									</div>

									<h3 class="book-title">{cycle.book.title}</h3>
									<p class="book-authors">by {cycle.book.authors.join(", ")}</p>

									{#if cycle.book.description}
										<p class="book-description">{cycle.book.description}</p>
									{/if}

									<div class="score-summary-bar">
										<div class="score-pill">
											<svg class="star-icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
											<span class="score-number">
												{cycle.averageRating?.toFixed(1) ?? "N/A"}
											</span>
											<span class="score-max">/ {STAR_MAX_RATING.toFixed(1)}</span>
										</div>

										<span class="review-count-text">
											{cycle.totalReviews ?? (cycle.reviews?.length ?? 0)} member reviews submitted
										</span>
									</div>

									<div class="cycle-actions">
										<Button
											variant="yellow"
											size="md"
											onclick={() => openReviewsModal(cycle)}
										>
											Read Reviews ({cycle.reviews?.length ?? cycle.totalReviews ?? 0})
										</Button>

										<Button
											variant="neutral"
											size="md"
											onclick={() => openDiscussionsModal(cycle)}
										>
											View Discussion Archive ({cycle.discussions?.length ?? 0})
										</Button>

										{#if cycle.book.buyUrl}
											<a
												href={cycle.book.buyUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="retailer-link"
											>
												<Button variant="neutral" size="md">
													Book Info &rarr;
												</Button>
											</a>
										{/if}
									</div>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

{#if selectedCycleForReviews}
	<Modal
		isOpen={true}
		title="Archived Reviews: {selectedCycleForReviews.book.title}"
		onclose={closeReviewsModal}
	>
		<div class="reviews-modal-content">
			<div class="modal-summary-banner">
				<div class="banner-score">
					<svg class="star-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
					<span class="banner-number">
						{selectedCycleForReviews.averageRating?.toFixed(1) ?? "N/A"}
					</span>
					<span class="banner-max">/ {STAR_MAX_RATING.toFixed(1)}</span>
				</div>
				<span class="banner-count">
					{selectedCycleForReviews.totalReviews ?? 0} club ratings recorded
				</span>
			</div>

			<div class="reviews-list">
				{#if selectedCycleForReviews.reviews && selectedCycleForReviews.reviews.length > 0}
					{#each selectedCycleForReviews.reviews as review (review.id)}
						<div class="review-item">
							<div class="review-header">
								<div class="reviewer-identity">
									<img
										src={review.avatarUrl}
										alt={review.username}
										class="reviewer-avatar"
									/>
									<div class="reviewer-meta">
										<span class="reviewer-name">{review.username}</span>
										<span class="review-date">{formatDate(review.createdAt)}</span>
									</div>
								</div>

								<div class="reviewer-rating">
									<span class="star-pill">
										<svg class="star-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
										{review.rating.toFixed(1)}
									</span>
								</div>
							</div>

							{#if review.comment}
								<p class="review-comment">{review.comment}</p>
							{/if}

							{#if review.criteria}
								<div class="criteria-grid">
									<div class="criterion-item">
										<span class="criterion-name">Plot:</span>
										<span class="criterion-score">{review.criteria.plot} / {CRITERIA_MAX_SCORE}</span>
									</div>
									<div class="criterion-item">
										<span class="criterion-name">Characters:</span>
										<span class="criterion-score">{review.criteria.characters} / {CRITERIA_MAX_SCORE}</span>
									</div>
									<div class="criterion-item">
										<span class="criterion-name">Pacing:</span>
										<span class="criterion-score">{review.criteria.pacing} / {CRITERIA_MAX_SCORE}</span>
									</div>
									<div class="criterion-item">
										<span class="criterion-name">Writing:</span>
										<span class="criterion-score">{review.criteria.writing} / {CRITERIA_MAX_SCORE}</span>
									</div>
									<div class="criterion-item">
										<span class="criterion-name">Emotion:</span>
										<span class="criterion-score">{review.criteria.emotion} / {CRITERIA_MAX_SCORE}</span>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				{:else}
					<p class="no-items-text">No written reviews submitted for this cycle.</p>
				{/if}
			</div>
		</div>

		{#snippet footer()}
			<Button variant="neutral" size="md" onclick={closeReviewsModal}>
				Close
			</Button>
		{/snippet}
	</Modal>
{/if}

{#if selectedCycleForDiscussions}
	<Modal
		isOpen={true}
		title="Discussion Log: {selectedCycleForDiscussions.book.title}"
		onclose={closeDiscussionsModal}
	>
		<div class="discussions-modal-content">
			<div class="archive-notice">
				<span class="notice-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
				</span>
				<span class="notice-text">
					Archived Discussion Log &bull; Read-Only Mode &bull; All Spoilers Revealed
				</span>
			</div>

			<div class="messages-list">
				{#if selectedCycleForDiscussions.discussions && selectedCycleForDiscussions.discussions.length > 0}
					{#each selectedCycleForDiscussions.discussions as message (message.id)}
						<div class="message-item">
							<div class="message-header">
								<div class="message-sender">
									<img
										src={message.avatarUrl}
										alt={message.username}
										class="message-avatar"
									/>
									<span class="message-username">{message.username}</span>
								</div>

								<div class="message-tags">
									<span class="page-tag">
										{message.pageReference === 0 ? "Book-wide" : `Page ${message.pageReference}`}
									</span>
									<span class="message-time">{formatDate(message.createdAt)}</span>
								</div>
							</div>

							<p class="message-content">{message.content}</p>
						</div>
					{/each}
				{:else}
					<p class="no-items-text">No discussion comments archived for this cycle.</p>
				{/if}
			</div>
		</div>

		{#snippet footer()}
			<Button variant="neutral" size="md" onclick={closeDiscussionsModal}>
				Close
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.history-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.history-header {
		background-color: var(--bg-surface);
		border-bottom: var(--border-chunky);
		padding: 14px 24px;
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.header-container {
		max-width: 1140px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
		min-width: 0;
	}

	.back-link {
		text-decoration: none;
		flex-shrink: 0;
	}

	.club-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		flex-wrap: wrap;
	}

	.club-name {
		font-family: var(--font-sans);
		font-size: 1.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
	}

	.badge {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		border: 1.5px solid var(--border-color);
	}

	.history-badge {
		background-color: var(--brand-primary);
		color: #ffffff;
		border-color: var(--brand-shadow);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-shrink: 0;
	}

	.history-main {
		flex: 1;
		padding: 32px 20px;
	}

	.history-content {
		max-width: 1140px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.page-intro {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
	}

	.intro-text-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 600px;
	}

	.page-title {
		font-family: var(--font-sans);
		font-size: 2rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: var(--text-primary);
		margin: 0;
	}

	.page-subtitle {
		font-family: var(--font-sans);
		font-size: 1rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.stats-ribbon {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.stat-card {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		padding: 10px 18px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 100px;
	}

	.stat-value {
		font-family: var(--font-sans);
		font-size: 1.35rem;
		font-weight: 900;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat-label {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.cycles-list {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	:global(.cycle-archive-card) {
		width: 100%;
	}

	.cycle-layout {
		display: flex;
		gap: 24px;
		align-items: flex-start;
	}

	.cover-container {
		width: 130px;
		height: 195px;
		flex-shrink: 0;
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		overflow: hidden;
		background-color: var(--bg-surface-elevated);
		box-shadow: 0 4px 0 var(--border-color);
	}

	.cover-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
	}

	.cycle-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.cycle-badges {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.cadence-tag {
		background-color: var(--color-purple-base);
		color: #ffffff;
		border-color: var(--color-purple-shadow);
	}

	.status-tag {
		background-color: var(--color-green-base);
		color: var(--color-green-text);
		border-color: var(--color-green-shadow);
	}

	.status-tag.purged {
		background-color: var(--bg-surface-elevated);
		color: var(--text-muted);
		border-color: var(--border-color);
	}

	.date-tag {
		background-color: var(--bg-surface-elevated);
		color: var(--text-primary);
		border-color: var(--border-color);
	}

	.book-title {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.book-authors {
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-muted);
		margin: 0;
	}

	.book-description {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
		max-width: 720px;
	}

	.score-summary-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 4px 0;
		flex-wrap: wrap;
	}

	.score-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border: 2px solid var(--color-yellow-shadow);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 0.95rem;
	}

	.score-number {
		color: var(--color-yellow-text);
	}

	.score-max {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.star-icon-svg {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}

	.review-count-text {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.cycle-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 6px;
		flex-wrap: wrap;
	}

	.retailer-link {
		text-decoration: none;
	}

	.empty-state-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 14px;
		padding: 48px 20px;
	}

	.empty-icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--brand-primary);
	}

	.empty-title {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		font-weight: 900;
		text-transform: uppercase;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-description {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		color: var(--text-muted);
		max-width: 480px;
		margin: 0;
		line-height: 1.5;
	}

	.reviews-modal-content,
	.discussions-modal-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal-summary-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border: 2px solid var(--color-yellow-shadow);
		padding: 10px 16px;
		border-radius: var(--radius-md);
		flex-wrap: wrap;
		gap: 8px;
	}

	.banner-score {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 1.25rem;
	}

	.banner-max {
		font-size: 0.85rem;
		opacity: 0.85;
	}

	.banner-count {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.reviews-list,
	.messages-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
		max-height: 60vh;
		overflow-y: auto;
		padding-right: 4px;
	}

	.review-item,
	.message-item {
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.review-header,
	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}

	.reviewer-identity,
	.message-sender {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.reviewer-avatar,
	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1.5px solid var(--border-color);
		object-fit: cover;
	}

	.reviewer-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reviewer-name,
	.message-username {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.review-date,
	.message-time {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.star-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border: 1.5px solid var(--color-yellow-shadow);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.85rem;
	}

	.review-comment,
	.message-content {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	.criteria-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
		background-color: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 10px;
	}

	.criterion-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.criterion-name {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.criterion-score {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 900;
		color: var(--brand-primary);
	}

	.archive-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.notice-icon {
		display: flex;
		align-items: center;
		color: var(--text-muted);
	}

	.message-tags {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.page-tag {
		background-color: var(--color-blue-base);
		color: var(--color-blue-text);
		border: 1.5px solid var(--color-blue-shadow);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.no-items-text {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		text-align: center;
		padding: 24px 0;
		margin: 0;
	}

	@media (max-width: 768px) {
		.cycle-layout {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.cycle-details {
			align-items: center;
		}

		.cycle-badges {
			justify-content: center;
		}

		.score-summary-bar {
			justify-content: center;
		}

		.cycle-actions {
			justify-content: center;
			width: 100%;
		}

		:global(.cycle-actions button),
		:global(.cycle-actions .retailer-link) {
			width: 100%;
		}

		.page-intro {
			flex-direction: column;
			align-items: stretch;
		}

		.stats-ribbon {
			justify-content: space-between;
			width: 100%;
		}

		.stat-card {
			flex: 1;
		}
	}
</style>
