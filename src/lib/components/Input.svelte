<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";

let {
	value = $bindable(""),
	label,
	error,
	children,
	id,
	name,
	type = "text",
	placeholder = "",
	disabled = false,
	required = false,
	maxlength,
	autocomplete = "off",
	oninput,
}: {
	value?: string;
	label?: string;
	error?: string;
	children?: Snippet;
	id?: string;
	name?: string;
	type?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	maxlength?: number;
	autocomplete?: HTMLInputAttributes["autocomplete"];
	oninput?: (event: Event) => void;
} = $props();
</script>

<div class="input-wrapper" class:has-error={!!error}>
	{#if label}
		<label for={id} class="input-label">
			{label}
			{#if required}
				<span class="required-badge" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{name}
		{type}
		{placeholder}
		{disabled}
		{required}
		{maxlength}
		{autocomplete}
		{oninput}
		bind:value
		class="chunky-input"
		aria-invalid={!!error}
		aria-describedby={error && id ? `${id}-error` : undefined}
	/>

	{#if children}
		{@render children()}
	{/if}

	{#if error}
		<div id={id ? `${id}-error` : undefined} class="error-badge" role="alert">
			{error}
		</div>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}

	.input-label {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.required-badge {
		color: var(--color-red-base);
		margin-left: 2px;
	}

	.chunky-input {
		width: 100%;
		min-height: 44px;
		padding: 12px 16px;
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 1.05rem;
		background-color: var(--bg-surface);
		color: var(--text-primary);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.chunky-input::placeholder {
		color: var(--text-muted);
		font-weight: 600;
	}

	.chunky-input:focus,
	.chunky-input:focus-visible {
		border-color: var(--brand-primary);
		box-shadow: 0 4px 0 var(--brand-shadow);
		outline: 3px solid var(--border-color);
		outline-offset: 2px;
	}

	.has-error .chunky-input {
		border-color: var(--color-red-base);
		box-shadow: 0 4px 0 var(--color-red-shadow);
	}

	.error-badge {
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.85rem;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		border: 2px solid var(--color-red-shadow);
		align-self: flex-start;
		margin-top: 2px;
	}

	.chunky-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
