<script lang="ts">
import { goto } from "$app/navigation";
import { generateInviteCode } from "$lib/club/generator";
import Button from "$lib/components/Button.svelte";
import Card from "$lib/components/Card.svelte";
import Input from "$lib/components/Input.svelte";
import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";
import { CADENCE_TYPES, type CadenceType } from "$lib/constants/cadence";
import { CLUB_NAME_MAX_LENGTH, CLUB_NAME_MIN_LENGTH } from "$lib/constants/club";
import { ROUTES } from "$lib/constants/routes";

let clubName = $state("");
let selectedCadence = $state<CadenceType>("weekly");
let advancedReviews = $state(false);
let inviteCode = $state(generateInviteCode());
let errorMessage = $state("");
let isSubmitting = $state(false);

function handleRegenerateCode() {
	inviteCode = generateInviteCode();
}

async function handleCreateClub(event: SubmitEvent) {
	event.preventDefault();
	errorMessage = "";

	const trimmedName = clubName.trim();
	if (trimmedName.length < CLUB_NAME_MIN_LENGTH) {
		errorMessage = `Club name must be at least ${CLUB_NAME_MIN_LENGTH} characters`;
		return;
	}

	if (trimmedName.length > CLUB_NAME_MAX_LENGTH) {
		errorMessage = `Club name cannot exceed ${CLUB_NAME_MAX_LENGTH} characters`;
		return;
	}

	isSubmitting = true;

	try {
		const res = await fetch(ROUTES.API_CLUB_CREATE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: trimmedName,
				cadence: selectedCadence,
				advancedReviews,
			}),
		});

		const data = await res.json();

		if (!res.ok || !data.success) {
			errorMessage = data.error || "Failed to create club. Please try again.";
			isSubmitting = false;
			return;
		}

		goto(data.redirectUrl || ROUTES.CLUB_DASHBOARD(data.clubId));
	} catch {
		errorMessage = "Network error while creating club. Please check connection.";
		isSubmitting = false;
	}
}
</script>

<svelte:head>
	<title>Create a Reading Club - The Book Club</title>
</svelte:head>

<div class="wizard-page">
	<header class="wizard-header">
		<div class="header-container">
			<a href={ROUTES.HOME} class="brand-link">
				<span class="brand-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
				</span>
				<span class="brand-title">The Book Club</span>
			</a>
			<ThemeSwitch />
		</div>
	</header>

	<main class="wizard-main">
		<div class="wizard-container">
			<div class="wizard-title-block">
				<h1 class="wizard-title">Create a Reading Club</h1>
				<p class="wizard-subtitle">
					Set up your private group, customize cadence rules, and invite friends.
				</p>
			</div>

			<Card padding="lg" class="wizard-card">
				<form onsubmit={handleCreateClub} class="wizard-form">
					{#if errorMessage}
						<div class="error-banner" role="alert">
							{errorMessage}
						</div>
					{/if}

					<div class="form-section">
						<div class="input-header">
							<span class="step-badge">1</span>
							<label for="club-name-input" class="section-heading">Club Name</label>
						</div>
						<Input
							id="club-name-input"
							placeholder="e.g. Midnight Sci-Fi Club"
							maxlength={CLUB_NAME_MAX_LENGTH}
							bind:value={clubName}
							required
							disabled={isSubmitting}
						/>
						<div class="char-counter">
							{clubName.length} / {CLUB_NAME_MAX_LENGTH} characters
						</div>
					</div>

					<div class="form-section">
						<div class="input-header">
							<span class="step-badge">2</span>
							<span class="section-heading">Reading Cadence</span>
						</div>
						<div class="cadence-grid">
							{#each CADENCE_TYPES as cadence}
								<button
									type="button"
									class="cadence-option"
									class:selected={selectedCadence === cadence}
									onclick={() => (selectedCadence = cadence)}
								>
									<span class="cadence-name">{cadence}</span>
									<span class="cadence-desc">
										{#if cadence === "weekly"}
											7 days per book
										{:else if cadence === "monthly"}
											Calendar month
										{:else}
											Admin set date
										{/if}
									</span>
								</button>
							{/each}
						</div>
					</div>

					<div class="form-section">
						<div class="input-header">
							<span class="step-badge">3</span>
							<span class="section-heading">Review Format</span>
						</div>
						<button
							type="button"
							class="toggle-card"
							class:active={advancedReviews}
							onclick={() => (advancedReviews = !advancedReviews)}
						>
							<div class="toggle-info">
								<span class="toggle-title">Advanced Multi-Criteria Reviews</span>
								<span class="toggle-desc">
									Enable scoring across Plot, Characters, Pacing, Writing, and Emotion alongside standard 5-star ratings.
								</span>
							</div>
							<div class="toggle-switch-badge">
								{advancedReviews ? "ENABLED" : "STANDARD"}
							</div>
						</button>
					</div>

					<div class="form-section">
						<div class="input-header">
							<span class="step-badge">4</span>
							<span class="section-heading">Invite Code Preview</span>
						</div>
						<div class="code-preview-card">
							<div class="code-display">
								<span class="code-value">{inviteCode}</span>
							</div>
							<Button
								type="button"
								variant="neutral"
								size="sm"
								onclick={handleRegenerateCode}
								disabled={isSubmitting}
							>
								Regenerate
							</Button>
						</div>
					</div>

					<Button
						type="submit"
						variant="green"
						size="lg"
						fullWidth
						disabled={isSubmitting}
					>
						{isSubmitting ? "Creating Club..." : "Create Reading Club"}
					</Button>
				</form>
			</Card>
		</div>
	</main>
</div>

<style>
	.wizard-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.wizard-header {
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

	.brand-link {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
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

	.wizard-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
	}

	.wizard-container {
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.wizard-title-block {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.wizard-title {
		font-family: var(--font-sans);
		font-size: 2.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin: 0;
	}

	.wizard-subtitle {
		font-family: var(--font-sans);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-muted);
		margin: 0;
	}

	:global(.wizard-card) {
		width: 100%;
	}

	.wizard-form {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.error-banner {
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: 2px solid var(--color-red-shadow);
		border-radius: var(--radius-sm);
		padding: 12px 16px;
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.input-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.step-badge {
		background-color: var(--brand-primary);
		color: #ffffff;
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 0.85rem;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.section-heading {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 1.05rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-primary);
	}

	.char-counter {
		align-self: flex-end;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.cadence-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	.cadence-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 14px 10px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		cursor: pointer;
		transition: transform 0.08s ease, background-color 0.1s ease;
	}

	.cadence-option:hover {
		transform: translateY(-2px);
	}

	.cadence-option.selected {
		background-color: var(--brand-primary);
		color: #ffffff;
		border-color: var(--border-color);
		box-shadow: 0 4px 0 var(--brand-shadow);
	}

	.cadence-name {
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 1rem;
		text-transform: uppercase;
	}

	.cadence-desc {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 700;
		opacity: 0.85;
	}

	.toggle-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		cursor: pointer;
		text-align: left;
		transition: transform 0.08s ease, background-color 0.1s ease;
	}

	.toggle-card:hover {
		transform: translateY(-2px);
	}

	.toggle-card.active {
		border-color: var(--color-yellow-shadow);
		background-color: var(--bg-surface-elevated);
	}

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.toggle-title {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.toggle-desc {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.toggle-switch-badge {
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 0.8rem;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		border: 2px solid var(--border-color);
		background-color: var(--bg-surface);
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.toggle-card.active .toggle-switch-badge {
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border-color: var(--color-yellow-shadow);
	}

	.code-preview-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background-color: var(--bg-surface-elevated);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
	}

	.code-display {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.code-value {
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 1.25rem;
		letter-spacing: 0.08em;
		color: var(--brand-primary);
	}

	@media (max-width: 600px) {
		.cadence-grid {
			grid-template-columns: 1fr;
		}

		.wizard-title {
			font-size: 1.85rem;
		}
	}
</style>
