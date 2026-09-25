<script lang="ts">
import { DEFAULT_THEME, STORAGE_KEYS, THEMES, type Theme } from "$lib/constants/ui";
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

const themeLabels: Record<Theme, { label: string; icon: string }> = {
	classic: { label: "Classic", icon: "☀️" },
	midnight: { label: "Midnight", icon: "🌙" },
	bookshelf: { label: "Bookshelf", icon: "📖" },
};
</script>

<div class="theme-switch-container">
	<Button
		variant="neutral"
		size="sm"
		onclick={cycleTheme}
		ariaLabel="Switch color theme"
	>
		<span class="theme-icon" aria-hidden="true">{themeLabels[currentTheme].icon}</span>
		<span class="theme-name">{themeLabels[currentTheme].label}</span>
	</Button>
</div>

<style>
	.theme-switch-container {
		display: inline-flex;
		align-items: center;
	}

	.theme-icon {
		margin-right: 6px;
		font-size: 1rem;
	}

	.theme-name {
		font-weight: 800;
	}
</style>
