<script lang="ts">
import "../app.css";
import type { Snippet } from "svelte";

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<div class="app-container">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
