<script lang="ts">
import type { Snippet } from "svelte";
import Button from "./Button.svelte";

interface Props {
	isOpen: boolean;
	title?: string;
	onclose?: () => void;
	children?: Snippet;
	footer?: Snippet;
}

const { isOpen = false, title = "", onclose, children, footer }: Props = $props();

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape" && isOpen && onclose) {
		onclose();
	}
}

function handleBackdropClick(event: MouseEvent) {
	if (event.target === event.currentTarget && onclose) {
		onclose();
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={handleBackdropClick}
	>
		<div
			class="modal-dialog"
			role="dialog"
			aria-modal="true"
			aria-label={title || "Dialog"}
		>
			<div class="modal-header">
				{#if title}
					<h2 class="modal-title">{title}</h2>
				{/if}
				{#if onclose}
					<Button
						variant="red"
						size="sm"
						onclick={onclose}
						ariaLabel="Close modal"
					>
						✕
					</Button>
				{/if}
			</div>

			<div class="modal-body">
				{#if children}
					{@render children()}
				{/if}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.65);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 16px;
	}

	.modal-dialog {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 0 var(--border-color);
		width: 100%;
		max-width: 520px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: popIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes popIn {
		from {
			transform: scale(0.92);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: var(--border-chunky);
		background-color: var(--bg-surface-elevated);
	}

	.modal-title {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 1.25rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-body {
		padding: 20px;
		overflow-y: auto;
		color: var(--text-primary);
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 20px;
		border-top: var(--border-chunky);
		background-color: var(--bg-surface-elevated);
	}
</style>
