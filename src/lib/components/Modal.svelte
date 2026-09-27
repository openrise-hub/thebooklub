<script lang="ts">
import type { Snippet } from "svelte";
import Button from "./Button.svelte";

interface Props {
	isOpen: boolean;
	title?: string;
	ariaLabel?: string;
	id?: string;
	onclose?: () => void;
	children?: Snippet;
	footer?: Snippet;
}

const { isOpen = false, title = "", ariaLabel, id, onclose, children, footer }: Props = $props();

let dialogElement = $state<HTMLDivElement | null>(null);
const dialogId = $derived(id || "modal-dialog");
const titleId = $derived(`${dialogId}-title`);

$effect(() => {
	if (isOpen && typeof document !== "undefined") {
		document.body.classList.add("modal-open");

		// Focus the dialog or the first interactive element
		setTimeout(() => {
			if (dialogElement) {
				const focusable = dialogElement.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);
				if (focusable.length > 0) {
					focusable[0]?.focus();
				} else {
					dialogElement.focus();
				}
			}
		}, 0);

		return () => {
			document.body.classList.remove("modal-open");
		};
	}
});

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape" && isOpen && onclose) {
		event.stopPropagation();
		onclose();
	}
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const selector =
		'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
	return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => el.offsetWidth > 0 || el.offsetHeight > 0,
	);
}

function handleDialogKeydown(event: KeyboardEvent) {
	if (event.key !== "Tab" || !dialogElement) return;

	const focusable = getFocusableElements(dialogElement);
	if (focusable.length === 0) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (
		event.shiftKey &&
		(document.activeElement === first || document.activeElement === dialogElement)
	) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
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
			bind:this={dialogElement}
			class="modal-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			aria-label={!title ? (ariaLabel || "Dialog") : undefined}
			tabindex="-1"
			onkeydown={handleDialogKeydown}
		>
			<div class="modal-header">
				{#if title}
					<h2 id={titleId} class="modal-title">{title}</h2>
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
