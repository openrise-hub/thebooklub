<script lang="ts">
import { evaluateCycleState, formatCountdown } from "$lib/cadence/engine";
import Button from "$lib/components/Button.svelte";
import Card from "$lib/components/Card.svelte";
import PDFViewer from "$lib/components/PDFViewer.svelte";
import RaceTrack from "$lib/components/RaceTrack.svelte";
import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
import { ROUTES } from "$lib/constants/routes";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let isPdfReaderOpen = $state(false);

let activeTab = $state<"discussion" | "reviews" | "selection" | "history" | "settings">(
	"discussion",
);

const tabs = [
	{ id: "discussion", label: "Discussion" },
	{ id: "reviews", label: "Reviews" },
	{ id: "selection", label: "Book Selection" },
	{ id: "history", label: "History" },
	{ id: "settings", label: "Settings" },
] as const;

let cycleEvaluation = $derived(data.activeCycle ? evaluateCycleState(data.activeCycle) : null);

let countdownString = $derived(
	cycleEvaluation ? formatCountdown(cycleEvaluation) : "No active cycle",
);

let userProgress = $derived.by(() => {
	if (!data.activeCycle || !data.members) return null;
	const currentMember = data.members[0];
	if (!currentMember) return null;
	const total = data.activeCycle.book.pageCount || 1;
	const percent = Math.min(100, Math.round((currentMember.currentPage / total) * 100));
	return {
		page: currentMember.currentPage,
		total,
		percent,
	};
});
</script>

<svelte:head>
	<title>{data.club.name} - Dashboard</title>
</svelte:head>

<div class="dashboard-page">
	<header class="dashboard-header">
		<div class="header-container">
			<div class="header-left">
				<a href={ROUTES.HOME} class="brand-link" aria-label="Return home">
					<span class="brand-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
					</span>
				</a>
				<div class="club-title-group">
					<h1 class="club-name">{data.club.name}</h1>
					<div class="club-badges">
						<span class="badge code-badge" aria-label="Invite code: {data.club.inviteCode}">
							{data.club.inviteCode}
						</span>
						<span class="badge cadence-badge">
							{data.club.cadence} cadence
						</span>
					</div>
				</div>
			</div>

			<div class="header-right">
				{#if data.members.length > 0}
					<div class="user-pill">
						<img
							src={data.members[0].avatarUrl}
							alt={data.members[0].username}
							class="user-avatar"
						/>
						<span class="user-name">{data.members[0].username}</span>
					</div>
				{/if}
				<ThemeSwitch />
			</div>
		</div>
	</header>

	<main class="dashboard-main">
		<div class="dashboard-content">
			{#if data.activeCycle}
				<section class="hero-section" aria-labelledby="active-book-title">
					<Card padding="lg" class="hero-card">
						<div class="hero-layout">
							<div class="hero-cover-container">
								{#if data.activeCycle.book.coverUrl}
									<img
										src={data.activeCycle.book.coverUrl}
										alt={data.activeCycle.book.title}
										class="hero-cover-img"
									/>
								{:else}
									<div class="hero-cover-placeholder" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
									</div>
								{/if}
							</div>

							<div class="hero-details">
								<div class="hero-top-badges">
									<span class="status-pill active">Active Reading Cycle</span>
									<span class="status-pill countdown">
										{countdownString}
									</span>
								</div>

								<h2 id="active-book-title" class="book-main-title">
									{data.activeCycle.book.title}
								</h2>

								<p class="book-main-authors">
									by {data.activeCycle.book.authors.join(", ")}
								</p>

								{#if data.activeCycle.book.description}
									<p class="book-description">
										{data.activeCycle.book.description}
									</p>
								{/if}

								{#if userProgress}
									<div class="progress-bar-container">
										<div class="progress-labels">
											<span class="progress-label-text">Your Reading Progress</span>
											<span class="progress-pages">Page {userProgress.page} of {userProgress.total} ({userProgress.percent}%)</span>
										</div>
										<div class="progress-track" role="progressbar" aria-valuenow={userProgress.page} aria-valuemin={0} aria-valuemax={userProgress.total}>
											<div class="progress-fill" style="width: {userProgress.percent}%;"></div>
										</div>
									</div>
								{/if}

								<div class="hero-actions">
									{#if data.activeCycle.pdfKey}
										<Button
											variant="purple"
											size="md"
											onclick={() => (isPdfReaderOpen = true)}
										>
											Read Online (PDF)
										</Button>
									{:else}
										<Button variant="purple" size="md" disabled>
											Read Online (No PDF)
										</Button>
									{/if}

									{#if data.activeCycle.book.buyUrl}
										<a
											href={data.activeCycle.book.buyUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="buy-link-btn"
										>
											<Button variant="neutral" size="md">
												Explore / Buy &rarr;
											</Button>
										</a>
									{/if}
								</div>
							</div>
						</div>
					</Card>
				</section>

				<section class="race-section" aria-label="Reading race progress">
					<RaceTrack
						members={data.members}
						totalPages={data.activeCycle.book.pageCount || 1}
					/>
				</section>
			{/if}

			<section class="tabs-section">
				<div class="tabs-nav" role="tablist">
					{#each tabs as tab}
						<button
							type="button"
							role="tab"
							id="tab-{tab.id}"
							aria-selected={activeTab === tab.id}
							aria-controls="panel-{tab.id}"
							class="tab-button"
							class:active={activeTab === tab.id}
							onclick={() => (activeTab = tab.id)}
						>
							<span class="tab-label">{tab.label}</span>
						</button>
					{/each}
				</div>

				<div
					id="panel-{activeTab}"
					role="tabpanel"
					aria-labelledby="tab-{activeTab}"
					class="tab-content-panel"
				>
					<Card padding="lg">
						{#if activeTab === "discussion"}
							<div class="panel-placeholder">
								<h3 class="panel-heading">Club Discussion Feed</h3>
								<p class="panel-text">
									Page-indexed comments and anti-spoiler threads will appear here in Phase 5.
								</p>
							</div>
						{:else if activeTab === "reviews"}
							<div class="panel-placeholder">
								<h3 class="panel-heading">Reviews & Scores</h3>
								<p class="panel-text">
									Standard star ratings and 5-criteria rubrics will appear here in Phase 5.
								</p>
							</div>
						{:else if activeTab === "selection"}
							<div class="panel-placeholder">
								<h3 class="panel-heading">Book Selection Polls & Roulette</h3>
								<p class="panel-text">
									Synchronized wheel of choice and timed voting will appear here in Phase 7.
								</p>
							</div>
						{:else if activeTab === "history"}
							<div class="panel-placeholder">
								<h3 class="panel-heading">Past Cycles Archive</h3>
								<p class="panel-text">
									Browse past completed books, member reviews, rubrics, and discussion logs in read-only archive mode.
								</p>
								<div style="margin-top: 12px;">
									<a href={ROUTES.CLUB_HISTORY(data.club.id)} style="text-decoration: none;">
										<Button variant="purple" size="md">
											Open Full History Archive &rarr;
										</Button>
									</a>
								</div>
							</div>
						{:else if activeTab === "settings"}
							<div class="panel-placeholder">
								<h3 class="panel-heading">Club Settings & PDF Upload</h3>
								<p class="panel-text">
									Admin cadence controls and Cloudflare R2 PDF management will appear here in Phase 4.
								</p>
							</div>
						{/if}
					</Card>
				</div>
			</section>
		</div>
	</main>
</div>

{#if isPdfReaderOpen && data.activeCycle}
	<PDFViewer
		isOpen={isPdfReaderOpen}
		clubId={data.club.id}
		bookTitle={data.activeCycle.book.title}
		bookAuthor={data.activeCycle.book.authors.join(", ")}
		pdfUrl={`/api/club/${data.club.id}/pdf?fileKey=${encodeURIComponent(data.activeCycle.pdfKey || "")}`}
		initialPage={userProgress?.page || 1}
		totalPages={data.activeCycle.book.pageCount || 1}
		onclose={() => (isPdfReaderOpen = false)}
	/>
{/if}

<style>
	.dashboard-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.dashboard-header {
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
		gap: 14px;
		min-width: 0;
	}

	.brand-link {
		font-size: 1.75rem;
		line-height: 1;
		text-decoration: none;
		flex-shrink: 0;
	}

	.club-title-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.club-name {
		font-family: var(--font-sans);
		font-size: 1.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.club-badges {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.badge {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		border: 1.5px solid var(--border-color);
	}

	.code-badge {
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border-color: var(--color-yellow-shadow);
	}

	.cadence-badge {
		background-color: var(--bg-surface-elevated);
		color: var(--text-muted);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-shrink: 0;
	}

	.user-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		padding: 4px 10px 4px 4px;
		border-radius: 999px;
	}

	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		border: 1.5px solid var(--border-color);
	}

	.user-name {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.dashboard-main {
		flex: 1;
		padding: 32px 20px;
	}

	.dashboard-content {
		max-width: 1140px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	:global(.hero-card) {
		width: 100%;
	}

	.hero-layout {
		display: flex;
		gap: 28px;
		align-items: flex-start;
	}

	.hero-cover-container {
		width: 140px;
		height: 210px;
		flex-shrink: 0;
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		overflow: hidden;
		background-color: var(--bg-surface-elevated);
		box-shadow: 0 4px 0 var(--border-color);
	}

	.hero-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.hero-cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
	}

	.hero-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.hero-top-badges {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.status-pill {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		border: 2px solid var(--border-color);
	}

	.status-pill.active {
		background-color: var(--brand-primary);
		color: #ffffff;
		border-color: var(--brand-shadow);
	}

	.status-pill.countdown {
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border-color: var(--color-yellow-shadow);
	}

	.book-main-title {
		font-family: var(--font-sans);
		font-size: 2rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.15;
	}

	.book-main-authors {
		font-family: var(--font-sans);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-muted);
		margin: 0;
	}

	.book-description {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
		max-width: 680px;
	}

	.progress-bar-container {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 480px;
		margin-top: 4px;
	}

	.progress-labels {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 800;
	}

	.progress-label-text {
		color: var(--text-primary);
		text-transform: uppercase;
	}

	.progress-pages {
		color: var(--brand-primary);
	}

	.progress-track {
		height: 14px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-green-base);
		transition: width 0.3s ease;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	.buy-link-btn {
		text-decoration: none;
	}

	.tabs-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.tabs-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.tab-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		cursor: pointer;
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.02em;
		transition: transform 0.08s ease, background-color 0.1s ease, color 0.1s ease;
		white-space: nowrap;
		min-height: 44px;
	}

	.tab-button:hover {
		transform: translateY(-2px);
		color: var(--text-primary);
	}

	.tab-button.active {
		background-color: var(--brand-primary);
		color: #ffffff;
		border-color: var(--border-color);
		box-shadow: 0 4px 0 var(--brand-shadow);
	}

	.panel-placeholder {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-align: center;
		padding: 32px 16px;
	}

	.panel-heading {
		font-family: var(--font-sans);
		font-size: 1.35rem;
		font-weight: 900;
		text-transform: uppercase;
		color: var(--text-primary);
		margin: 0;
	}

	.panel-text {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		color: var(--text-muted);
		margin: 0;
	}

	@media (max-width: 768px) {
		.hero-layout {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.hero-details {
			align-items: center;
		}

		.hero-top-badges {
			justify-content: center;
		}

		.progress-bar-container {
			width: 100%;
		}

		.hero-actions {
			justify-content: center;
		}

		.book-main-title {
			font-size: 1.6rem;
		}
	}
</style>
