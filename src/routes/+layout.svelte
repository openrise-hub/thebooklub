<script lang="ts">
import "../app.css";
import { t } from "$lib/i18n";
import { localeState } from "$lib/i18n/state.svelte";
import type { Snippet } from "svelte";
import { ClerkProvider } from "svelte-clerk";
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

{#if data?.authProvider === "clerk" && data?.clerkPublishableKey}
	<ClerkProvider publishableKey={data.clerkPublishableKey}>
		<div class="app-container">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</ClerkProvider>
{:else}
	<div class="app-container">
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}

<style>
	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
