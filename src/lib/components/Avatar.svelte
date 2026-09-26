<script lang="ts">
import type { AvatarSizeName, GravatarFallbackMode } from "$lib/constants/avatars";
import {
	extractInitials,
	getAvatarSeedColor,
	getGravatarUrl,
	resolveAvatarSize,
} from "$lib/utils/gravatar";

interface Props {
	src?: string;
	email?: string;
	username?: string;
	size?: AvatarSizeName | number;
	shape?: "circle" | "square" | "rounded";
	fallback?: GravatarFallbackMode;
	alt?: string;
	border?: boolean;
}

const {
	src,
	email,
	username = "Reader",
	size = "md",
	shape = "circle",
	fallback = "retro",
	alt,
	border = true,
}: Props = $props();

let computedSrc = $state<string | undefined>(undefined);
let hasError = $state(false);

const pixelSize = $derived(resolveAvatarSize(size));
const initials = $derived(extractInitials(username));
const seedBgColor = $derived(getAvatarSeedColor(username));

$effect(() => {
	if (src) {
		computedSrc = src;
		hasError = false;
	} else if (email) {
		hasError = false;
		getGravatarUrl(email, { size: pixelSize, fallback })
			.then((url) => {
				computedSrc = url;
			})
			.catch(() => {
				hasError = true;
			});
	} else {
		computedSrc = undefined;
	}
});

function handleImageError() {
	hasError = true;
}
</script>

<div
	class="avatar-container {shape}"
	class:has-border={border}
	style="width: {pixelSize}px; height: {pixelSize}px; font-size: {Math.max(10, Math.round(pixelSize * 0.4))}px;"
	data-size={size}
	data-username={username}
>
	{#if computedSrc && !hasError}
		<img
			src={computedSrc}
			alt={alt || `${username}'s avatar`}
			class="avatar-img"
			onerror={handleImageError}
			loading="lazy"
		/>
	{:else}
		<div
			class="avatar-initials"
			style="background-color: {seedBgColor};"
			aria-label={alt || `${username}'s avatar`}
		>
			<span class="initials-text">{initials}</span>
		</div>
	{/if}
</div>

<style>
	.avatar-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
		background-color: var(--bg-surface-elevated);
		box-sizing: border-box;
		user-select: none;
	}

	.avatar-container.has-border {
		border: 2px solid var(--border-color);
		box-shadow: 0 2px 0 var(--border-color);
	}

	.avatar-container.circle {
		border-radius: 50%;
	}

	.avatar-container.rounded {
		border-radius: var(--radius-sm, 6px);
	}

	.avatar-container.square {
		border-radius: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.avatar-initials {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		font-family: var(--font-sans);
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.5px;
	}

	.initials-text {
		text-transform: uppercase;
	}
</style>
