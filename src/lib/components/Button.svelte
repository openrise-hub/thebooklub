<script lang="ts">
import type { ActionColorVariant } from "$lib/constants/ui";
import type { Snippet } from "svelte";

interface Props {
	variant?: ActionColorVariant | "neutral";
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
	fullWidth?: boolean;
	size?: "sm" | "md" | "lg";
	onclick?: (event: MouseEvent) => void;
	children?: Snippet;
	ariaLabel?: string;
	id?: string;
	form?: string;
}

const {
	variant = "purple",
	type = "button",
	disabled = false,
	fullWidth = false,
	size = "md",
	onclick,
	children,
	ariaLabel,
	id,
	form,
}: Props = $props();
</script>

<button
	{id}
	{form}
	{type}
	{disabled}
	aria-label={ariaLabel}
	class="chunky-button variant-{variant} size-{size}"
	class:full-width={fullWidth}
	{onclick}
>
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.chunky-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		min-width: 44px;
		font-family: var(--font-sans);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		cursor: pointer;
		user-select: none;
		outline: none;
		transition: transform 0.08s ease, box-shadow 0.08s ease;
		box-shadow: 0 6px 0 var(--btn-shadow);
	}

	/* Size Variants */
	.size-sm {
		padding: 8px 14px;
		font-size: 0.85rem;
		min-height: 44px;
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 0 var(--btn-shadow);
	}

	.size-md {
		padding: 12px 22px;
		font-size: 1rem;
		border-radius: var(--radius-md);
		box-shadow: 0 6px 0 var(--btn-shadow);
	}

	.size-lg {
		padding: 16px 28px;
		font-size: 1.15rem;
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 0 var(--btn-shadow);
	}

	.full-width {
		width: 100%;
	}

	/* Color Variants */
	.variant-purple {
		background-color: var(--brand-primary);
		color: var(--brand-text);
		--btn-shadow: var(--brand-shadow);
	}

	.variant-red {
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		--btn-shadow: var(--color-red-shadow);
	}

	.variant-blue {
		background-color: var(--color-blue-base);
		color: var(--color-blue-text);
		--btn-shadow: var(--color-blue-shadow);
	}

	.variant-yellow {
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		--btn-shadow: var(--color-yellow-shadow);
	}

	.variant-green {
		background-color: var(--color-green-base);
		color: var(--color-green-text);
		--btn-shadow: var(--color-green-shadow);
	}

	.variant-neutral {
		background-color: var(--bg-surface-elevated);
		color: var(--text-primary);
		--btn-shadow: var(--border-color);
	}

	/* Tactile Push-down Interaction */
	.chunky-button:hover:not(:disabled) {
		filter: brightness(1.04);
	}

	.chunky-button:active:not(:disabled) {
		transform: translateY(var(--press-offset));
		box-shadow: 0 2px 0 var(--btn-shadow);
	}

	.size-sm:active:not(:disabled) {
		transform: translateY(2px);
		box-shadow: 0 2px 0 var(--btn-shadow);
	}

	.size-lg:active:not(:disabled) {
		transform: translateY(5px);
		box-shadow: 0 3px 0 var(--btn-shadow);
	}

	.chunky-button:focus-visible {
		outline: 3px solid var(--border-color);
		outline-offset: 3px;
	}

	/* Disabled State */
	.chunky-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		filter: none;
	}
</style>
