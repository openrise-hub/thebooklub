<script lang="ts">
import { DEFAULT_THEME, STORAGE_KEYS, THEMES, type Theme } from "$lib/constants/ui";
import { type MessageKey, t } from "$lib/i18n";
import { onMount } from "svelte";
import Button from "./Button.svelte";

let currentTheme = $state<Theme>(DEFAULT_THEME);

onMount(() => {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
		if (stored && THEMES.includes(stored)) {
			currentTheme = stored;
		} else {
			const domTheme = document.documentElement.getAttribute("data-theme") as Theme | null;
			if (domTheme && THEMES.includes(domTheme)) {
				currentTheme = domTheme;
			}
		}
	} catch {
		currentTheme = DEFAULT_THEME;
	}
});

function cycleTheme() {
	const currentIndex = THEMES.indexOf(currentTheme);
	const nextIndex = (currentIndex + 1) % THEMES.length;
	const nextTheme = THEMES[nextIndex];
	setTheme(nextTheme);
}

function setTheme(theme: Theme) {
	currentTheme = theme;
	try {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem(STORAGE_KEYS.THEME, theme);
	} catch {
		// Ignore storage quota or disabled storage errors
	}
}

const themeKeys: Record<Theme, MessageKey> = {
	classic: "theme_classic",
	midnight: "theme_midnight",
	bookshelf: "theme_bookshelf",
};
</script>

<div class="theme-switch-container">
	<Button
		variant="neutral"
		size="sm"
		onclick={cycleTheme}
		ariaLabel={t("theme_switch_aria")}
	>
		<span class="theme-name">{t(themeKeys[currentTheme])} {t("theme_suffix")}</span>
	</Button>
</div>

<style>
	.theme-switch-container {
		display: inline-flex;
		align-items: center;
	}

	.theme-name {
		font-weight: 800;
	}
</style>
