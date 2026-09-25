<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	elevated?: boolean;
	padding?: "none" | "sm" | "md" | "lg";
	class?: string;
	children?: Snippet;
	id?: string;
}

const { elevated = false, padding = "md", class: customClass = "", children, id }: Props = $props();
</script>

<div
	{id}
	class="chunky-card padding-{padding} {customClass}"
	class:elevated
>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.chunky-card {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		box-shadow: var(--depth-card);
		color: var(--text-primary);
		transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.elevated {
		background-color: var(--bg-surface-elevated);
	}

	.padding-none {
		padding: 0;
	}

	.padding-sm {
		padding: 12px;
	}

	.padding-md {
		padding: 24px;
	}

	.padding-lg {
		padding: 36px;
	}
</style>
