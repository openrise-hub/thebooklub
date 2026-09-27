<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { resolvePendingClubJoin, setPendingClubCode } from "$lib/club/join";
import { normalizeInviteCode, validateInviteCode } from "$lib/club/validation";
import AuthModal from "$lib/components/AuthModal.svelte";
import Button from "$lib/components/Button.svelte";
import Card from "$lib/components/Card.svelte";
import Input from "$lib/components/Input.svelte";
import LanguageSwitch from "$lib/components/LanguageSwitch.svelte";
import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
import { ROUTES } from "$lib/constants/routes";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let clubCode = $state("");
let errorMessage = $state("");
let isSubmitting = $state(false);
let isAuthModalOpen = $state(false);
let pendingInviteCode = $state("");

$effect(() => {
	const joinParam = page.url.searchParams.get("join");
	if (joinParam && clubCode === "") {
		const normalized = normalizeInviteCode(joinParam);
		clubCode = normalized;
		const validation = validateInviteCode(normalized);
		if (validation.valid) {
			pendingInviteCode = validation.normalized;
			setPendingClubCode(validation.normalized);
			if (!data.user) {
				isAuthModalOpen = true;
			}
		}
	}
});

function handleCodeInput(event: Event) {
	const target = event.target as HTMLInputElement;
	clubCode = normalizeInviteCode(target.value);
	if (errorMessage) {
		errorMessage = "";
	}
}

async function handleJoinSubmit(event?: SubmitEvent) {
	event?.preventDefault();

	const result = validateInviteCode(clubCode);
	if (!result.valid) {
		errorMessage = result.error || "Invalid club code";
		return;
	}

	errorMessage = "";
	pendingInviteCode = result.normalized;
	setPendingClubCode(result.normalized);

	if (!data.user) {
		isAuthModalOpen = true;
		return;
	}

	isSubmitting = true;
	const joinRes = await resolvePendingClubJoin();
	if (joinRes?.success) {
		goto(joinRes.redirectUrl || ROUTES.CLUB_DASHBOARD(result.normalized));
	} else {
		goto(ROUTES.CLUB_DASHBOARD(result.normalized));
	}
}

async function handleAuthSuccess() {
	isAuthModalOpen = false;
	const joinRes = await resolvePendingClubJoin();
	if (joinRes?.success && joinRes.redirectUrl) {
		goto(joinRes.redirectUrl);
	} else if (pendingInviteCode) {
		goto(ROUTES.CLUB_DASHBOARD(pendingInviteCode));
	} else {
		goto(ROUTES.HOME);
	}
}
</script>

<svelte:head>
	<title>The Book Club - Join Your Reading Group</title>
</svelte:head>

<div class="landing-page">
	<header class="landing-header">
		<div class="header-container">
			<div class="brand">
				<span class="brand-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
				</span>
				<span class="brand-title">The Book Club</span>
			</div>
			<div class="header-actions">
				{#if data.user}
					<div class="user-greeting">
						<img
							src={data.user.avatarUrl}
							alt={data.user.username}
							class="user-avatar"
						/>
						<span class="user-name">{data.user.username}</span>
					</div>
				{:else}
					<Button
						variant="neutral"
						size="sm"
						onclick={() => {
							pendingInviteCode = "";
							isAuthModalOpen = true;
						}}
					>
						Sign In
					</Button>
				{/if}
				<LanguageSwitch />
				<ThemeSwitch />
			</div>
		</div>
	</header>

	<main class="landing-main">
		<div class="landing-hero-container">
			<div class="hero-brand-block">
				<div class="hero-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
				</div>
				<h1 class="hero-title">The Book Club</h1>
				<p class="hero-tagline">
					Private reading circles with zero-friction onboarding and arcade energy.
				</p>
			</div>

			<Card padding="lg" class="landing-card">
				<form onsubmit={handleJoinSubmit} class="join-form">
					<div class="form-header">
						<h2 class="form-title">Enter Club Code</h2>
						<p class="form-subtitle">Type your 8-character invite code to jump straight into your reading group.</p>
					</div>

					<Input
						id="club-code-input"
						label="Club Code"
						placeholder="e.g. READ-4821"
						maxlength={9}
						bind:value={clubCode}
						oninput={handleCodeInput}
						error={errorMessage}
						required
					/>

					<Button
						type="submit"
						variant="purple"
						size="lg"
						fullWidth
						disabled={isSubmitting}
					>
						Join Club
					</Button>
				</form>
			</Card>

			<div class="secondary-actions">
				<a href={ROUTES.CLUB_NEW} class="create-club-link">
					Want to create your own club? Register here &rarr;
				</a>
			</div>
		</div>
	</main>

	<AuthModal
		isOpen={isAuthModalOpen}
		pendingCode={pendingInviteCode}
		onclose={() => (isAuthModalOpen = false)}
		onsuccess={handleAuthSuccess}
	/>
</div>

<style>
	.landing-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.landing-header {
		background-color: var(--bg-surface);
		border-bottom: var(--border-chunky);
		padding: 16px 24px;
	}

	.header-container {
		max-width: 1080px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-greeting {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.brand-badge {
		font-size: 1.75rem;
		line-height: 1;
	}

	.brand-title {
		font-family: var(--font-sans);
		font-size: 1.35rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: var(--text-primary);
	}

	.landing-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
	}

	.landing-hero-container {
		width: 100%;
		max-width: 520px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	.hero-brand-block {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.hero-icon {
		font-size: 3rem;
		line-height: 1;
		margin-bottom: 4px;
	}

	.hero-title {
		font-family: var(--font-sans);
		font-size: 2.5rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		line-height: 1.1;
		margin: 0;
	}

	.hero-tagline {
		font-family: var(--font-sans);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-muted);
		margin: 0;
		max-width: 440px;
		line-height: 1.4;
	}

	:global(.landing-card) {
		width: 100%;
	}

	.join-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-title {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		font-weight: 900;
		text-transform: uppercase;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.form-subtitle {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	.secondary-actions {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.create-club-link {
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 800;
		color: var(--brand-primary);
		text-decoration: none;
		padding: 10px 18px;
		border-radius: var(--radius-md);
		border: 2px solid transparent;
		transition: transform 0.08s ease, background-color 0.15s ease, border-color 0.15s ease;
	}

	.create-club-link:hover {
		background-color: var(--bg-surface);
		border-color: var(--border-color);
		transform: translateY(-2px);
	}

	.create-club-link:focus-visible {
		outline: 3px solid var(--brand-primary);
		outline-offset: 2px;
	}

	@media (max-width: 600px) {
		.hero-title {
			font-size: 2rem;
		}

		.landing-main {
			padding: 24px 16px;
		}
	}
</style>
