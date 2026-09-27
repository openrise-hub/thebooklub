<script lang="ts">
import { isSpoiler } from "$lib/club/discussion";
import { t } from "$lib/i18n";

interface Props {
	content: string;
	pageReference: number;
	currentUserPage?: number;
	initialRevealed?: boolean;
}

const { content, pageReference, currentUserPage = 0, initialRevealed = false }: Props = $props();

let isManuallyRevealed = $state(false);

$effect(() => {
	if (initialRevealed) {
		isManuallyRevealed = true;
	}
});

let hasSpoiler = $derived(isSpoiler(pageReference, currentUserPage));
let isObscured = $derived(hasSpoiler && !isManuallyRevealed);

function handleToggleReveal() {
	isManuallyRevealed = !isManuallyRevealed;
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		handleToggleReveal();
	}
}
</script>

<div class="spoiler-container" class:obscured={isObscured}>
	<div
		class="spoiler-content"
		class:blurred={isObscured}
		aria-hidden={isObscured}
	>
		<p class="spoiler-paragraph">{content}</p>
	</div>

	{#if isObscured}
		<button
			type="button"
			class="spoiler-overlay-button"
			onclick={handleToggleReveal}
			onkeydown={handleKeyDown}
			aria-label={t("discussions_spoiler_warning", { page: pageReference, userPage: currentUserPage })}
		>
			<span class="spoiler-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
				</svg>
			</span>
			<span class="spoiler-text-prompt">
				{t("discussions_spoiler_warning", { page: pageReference, userPage: currentUserPage })}
			</span>
		</button>
	{:else if hasSpoiler && isManuallyRevealed}
		<div class="spoiler-revealed-bar">
			<span class="revealed-badge">{t("discussions_page_tag", { page: pageReference })}</span>
			<button
				type="button"
				class="hide-spoiler-btn"
				onclick={handleToggleReveal}
				aria-label={t("common_close")}
			>
				{t("common_close")}
			</button>
		</div>
	{/if}
</div>

<style>
	.spoiler-container {
		position: relative;
		width: 100%;
		border-radius: 4px;
	}

	.spoiler-container.obscured {
		min-height: 48px;
	}

	.spoiler-content {
		transition: filter 0.15s ease;
	}

	.spoiler-content.blurred {
		filter: blur(8px);
		user-select: none;
		pointer-events: none;
		opacity: 0.5;
	}

	.spoiler-paragraph {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.5;
	}

	.spoiler-overlay-button {
		position: absolute;
		inset: 0;
		margin: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background-color: var(--color-yellow);
		color: #000000;
		border: var(--border-chunky);
		border-radius: 6px;
		padding: 8px 14px;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		box-shadow: 0 4px 0 var(--border-color);
		transition: transform 0.05s ease, box-shadow 0.05s ease;
		z-index: 10;
		text-align: center;
	}

	.spoiler-overlay-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 0 var(--border-color);
	}

	.spoiler-overlay-button:active {
		transform: translateY(2px);
		box-shadow: 0 2px 0 var(--border-color);
	}

	.spoiler-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.spoiler-text-prompt {
		font-weight: 700;
		line-height: 1.3;
	}

	.spoiler-revealed-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 8px;
		padding: 4px 8px;
		background-color: var(--bg-surface);
		border: 1px dashed var(--border-color);
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.revealed-badge {
		font-weight: 700;
		color: var(--text-secondary);
	}

	.hide-spoiler-btn {
		background: none;
		border: none;
		color: var(--color-purple);
		font-weight: 700;
		font-size: 0.75rem;
		cursor: pointer;
		padding: 2px 6px;
		text-decoration: underline;
	}

	.hide-spoiler-btn:hover {
		color: var(--text-primary);
	}

	@media (max-width: 600px) {
		.spoiler-overlay-button {
			padding: 6px 10px;
			font-size: 0.78rem;
		}
	}
</style>
