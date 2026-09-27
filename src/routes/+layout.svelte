<script lang="ts">
import "../app.css";
import { t } from "$lib/i18n";
import { localeState } from "$lib/i18n/state.svelte";
import type { Snippet } from "svelte";
import type { LayoutData } from "./$types";

interface Props {
	data?: LayoutData;
	children?: Snippet;
}

const { data, children }: Props = $props();

$effect(() => {
	if (data?.locale) {
		localeState.init(data.locale);
	}
});
</script>

<a href="#main-content" class="skip-link">{t("nav_skip_to_content")}</a>

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
