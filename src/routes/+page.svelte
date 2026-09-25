<script lang="ts">
import Button from "$lib/components/Button.svelte";
import Card from "$lib/components/Card.svelte";
import Input from "$lib/components/Input.svelte";
import Modal from "$lib/components/Modal.svelte";
import ThemeSwitch from "$lib/components/ThemeSwitch.svelte";

let sampleCode = $state("");
let isModalOpen = $state(false);
let errorMessage = $state("");

function handleValidate() {
	if (sampleCode.trim().length === 0) {
		errorMessage = "Please enter a code to continue";
	} else {
		errorMessage = "";
		isModalOpen = true;
	}
}
</script>

<svelte:head>
	<title>The Book Club - Design System Showcase</title>
</svelte:head>

<header class="showcase-header">
	<div class="header-content">
		<div class="brand">
			<span class="brand-badge">📚</span>
			<h1 class="brand-title">The Book Club</h1>
		</div>
		<ThemeSwitch />
	</div>
</header>

<main class="showcase-main">
	<section class="hero-section">
		<Card padding="lg">
			<h2 class="section-title">Tactile Design Tokens & Components</h2>
			<p class="section-description">
				Solid geometric surfaces, 3px structural borders, and physical arcade push-down buttons.
			</p>

			<div class="demo-form">
				<Input
					label="Club Code"
					placeholder="e.g. READ-4821"
					maxlength={8}
					bind:value={sampleCode}
					error={errorMessage}
				/>
				<Button variant="purple" size="lg" onclick={handleValidate}>
					Verify Code
				</Button>
			</div>
		</Card>
	</section>

	<section class="components-grid">
		<Card padding="md">
			<h3 class="card-title">Universal Action Buttons</h3>
			<p class="card-subtitle">5 solid base colors with physical depth shadows:</p>

			<div class="button-row">
				<Button variant="purple">Purple (Brand)</Button>
				<Button variant="red">Red</Button>
				<Button variant="blue">Blue</Button>
				<Button variant="yellow">Yellow</Button>
				<Button variant="green">Green</Button>
				<Button variant="neutral">Neutral</Button>
			</div>
		</Card>

		<Card padding="md">
			<h3 class="card-title">Button Sizes & States</h3>
			<p class="card-subtitle">Scale and disabled handling:</p>

			<div class="button-row">
				<Button variant="blue" size="sm">Small</Button>
				<Button variant="blue" size="md">Medium</Button>
				<Button variant="blue" size="lg">Large</Button>
				<Button variant="blue" disabled>Disabled</Button>
			</div>
		</Card>

		<Card padding="md" elevated>
			<h3 class="card-title">Elevated Card Surface</h3>
			<p class="card-subtitle">Theme-aware elevated container surface with solid 3px border.</p>
			<Button variant="green" fullWidth onclick={() => (isModalOpen = true)}>
				Open Modal Dialog
			</Button>
		</Card>
	</section>
</main>

<Modal
	isOpen={isModalOpen}
	title="Club Verified"
	onclose={() => (isModalOpen = false)}
>
	<p>You have verified code: <strong>{sampleCode || "DEMO-1234"}</strong></p>
	<p style="margin-top: 12px; color: var(--text-muted);">
		This dialog demonstrates solid modal containers with keyboard escape handling and click-outside dismissal.
	</p>

	{#snippet footer()}
		<Button variant="neutral" size="sm" onclick={() => (isModalOpen = false)}>
			Cancel
		</Button>
		<Button variant="purple" size="sm" onclick={() => (isModalOpen = false)}>
			Confirm
		</Button>
	{/snippet}
</Modal>

<style>
	.showcase-header {
		background-color: var(--bg-surface);
		border-bottom: var(--border-chunky);
		padding: 16px 24px;
	}

	.header-content {
		max-width: 1080px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.brand-badge {
		font-size: 1.75rem;
	}

	.brand-title {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: var(--text-primary);
	}

	.showcase-main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 32px 20px;
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.section-title {
		font-size: 1.75rem;
		font-weight: 900;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.section-description {
		font-size: 1.05rem;
		color: var(--text-muted);
		margin-bottom: 24px;
	}

	.demo-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 480px;
	}

	.components-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 20px;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 6px;
	}

	.card-subtitle {
		font-size: 0.95rem;
		color: var(--text-muted);
		margin-bottom: 16px;
	}

	.button-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
	}
</style>
