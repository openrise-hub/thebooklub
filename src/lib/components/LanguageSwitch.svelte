<script lang="ts">
import {
	DEFAULT_LOCALE,
	LOCALE_LABELS,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "$lib/constants/i18n";
import { getLocale, setLocale } from "$lib/i18n";
import { onMount } from "svelte";

interface Props {
	class?: string;
}

const { class: customClass = "" }: Props = $props();

let currentLocale = $state<SupportedLocale>(DEFAULT_LOCALE);

onMount(() => {
	currentLocale = getLocale();
});

function handleSelectLocale(locale: SupportedLocale) {
	if (currentLocale === locale) return;
	currentLocale = locale;
	setLocale(locale);
}
</script>

<div
	class="language-switch {customClass}"
	role="group"
	aria-label="Language selector"
>
	{#each SUPPORTED_LOCALES as locale}
		{@const isActive = currentLocale === locale}
		<button
			type="button"
			class="locale-btn"
			class:active={isActive}
			aria-pressed={isActive}
			aria-label={`Switch to ${LOCALE_LABELS[locale]}`}
			onclick={() => handleSelectLocale(locale)}
		>
			<span class="locale-code">{locale.toUpperCase()}</span>
		</button>
	{/each}
</div>

<style>
	.language-switch {
		display: inline-flex;
		align-items: center;
		background: var(--color-surface, #ffffff);
		border: 3px solid var(--border-color, #1a1a1a);
		border-radius: 12px;
		box-shadow: 0 4px 0 var(--border-color, #1a1a1a);
		padding: 2px;
		gap: 2px;
		user-select: none;
	}

	.locale-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 38px;
		padding: 6px 12px;
		background: transparent;
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-muted, #5e6573);
		cursor: pointer;
		transition: transform 0.05s ease, background-color 0.1s ease, color 0.1s ease;
	}

	.locale-btn:hover:not(.active) {
		background: var(--color-elevated, #f0e6df);
		color: var(--text-primary, #1a1a1a);
	}

	.locale-btn:focus-visible {
		outline: 3px solid var(--color-primary, #46178f);
		outline-offset: 2px;
	}

	.locale-btn.active {
		background: var(--color-primary, #46178f);
		color: #ffffff;
		font-weight: 800;
	}

	.locale-btn:active {
		transform: scale(0.95);
	}

	.locale-code {
		letter-spacing: 0.05em;
	}

	@media (max-width: 640px) {
		.locale-btn {
			min-height: 44px;
			padding: 8px 10px;
		}
	}
</style>
