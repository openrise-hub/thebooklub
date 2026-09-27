<script lang="ts">
import { COPY_FEEDBACK_DURATION_MS } from "$lib/constants/qr";
import {
	buildClubInviteUrl,
	copyToClipboard,
	downloadQrDataUrl,
	formatQrFilename,
	generateQrPngDataUrl,
	generateQrSvg,
} from "$lib/utils/qrcode";
import Button from "./Button.svelte";
import Modal from "./Modal.svelte";

interface Props {
	isOpen: boolean;
	clubName: string;
	inviteCode: string;
	origin?: string;
	onclose?: () => void;
}

const { isOpen = false, clubName, inviteCode, origin = "", onclose }: Props = $props();

let qrSvg = $state("");
let isGenerating = $state(false);
let isDownloading = $state(false);
let copied = $state(false);
let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

const resolvedOrigin = $derived(
	origin || (typeof window !== "undefined" ? window.location.origin : ""),
);

const inviteUrl = $derived(buildClubInviteUrl(resolvedOrigin, inviteCode));

$effect(() => {
	if (isOpen && inviteUrl) {
		isGenerating = true;
		generateQrSvg(inviteUrl)
			.then((svg) => {
				qrSvg = svg;
			})
			.catch(() => {
				qrSvg = "";
			})
			.finally(() => {
				isGenerating = false;
			});
	}
});

async function handleCopy() {
	if (!inviteUrl) return;
	const success = await copyToClipboard(inviteUrl);
	if (success) {
		copied = true;
		if (copyTimeoutId) clearTimeout(copyTimeoutId);
		copyTimeoutId = setTimeout(() => {
			copied = false;
		}, COPY_FEEDBACK_DURATION_MS);
	}
}

async function handleDownload() {
	if (!inviteUrl || isDownloading) return;
	isDownloading = true;

	try {
		const dataUrl = await generateQrPngDataUrl(inviteUrl);
		const filename = formatQrFilename(clubName);
		downloadQrDataUrl(dataUrl, filename);
	} finally {
		isDownloading = false;
	}
}
</script>

<Modal {isOpen} title="Club Invite QR Code" {onclose}>
	<div class="qr-modal-content">
		<div class="club-info-header">
			<h3 class="club-name-label">{clubName}</h3>
			<div class="invite-code-pill" aria-label="Invite Code: {inviteCode}">
				<span class="pill-label">CODE:</span>
				<span class="pill-code">{inviteCode}</span>
			</div>
		</div>

		<!-- QR Display Card -->
		<div class="qr-display-box" aria-label="QR Code to join club">
			{#if isGenerating}
				<div class="qr-loading-placeholder">
					<svg class="spinner" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3">
						<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"/>
					</svg>
					<span>Generating QR Code...</span>
				</div>
			{:else if qrSvg}
				<div class="qr-svg-wrapper">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html qrSvg}
				</div>
			{:else}
				<div class="qr-error-placeholder">
					<span>Unable to generate QR code</span>
				</div>
			{/if}
		</div>

		<!-- Target URL Box -->
		<div class="invite-url-box">
			<span class="url-label">Direct Invite Link</span>
			<input
				type="text"
				readonly
				value={inviteUrl}
				class="url-input"
				aria-label="Direct club invite link"
				onclick={(e) => (e.currentTarget as HTMLInputElement).select()}
			/>
		</div>

		<!-- Action Buttons -->
		<div class="actions-row">
			<Button
				variant={copied ? "green" : "blue"}
				size="md"
				fullWidth
				onclick={handleCopy}
				ariaLabel="Copy invite link to clipboard"
			>
				{#if copied}
					<span class="btn-inner">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
						</svg>
						<span>Copied to Clipboard!</span>
					</span>
				{:else}
					<span class="btn-inner">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
						</svg>
						<span>Copy Invite Link</span>
					</span>
				{/if}
			</Button>

			<Button
				variant="yellow"
				size="md"
				fullWidth
				disabled={isDownloading}
				onclick={handleDownload}
				ariaLabel="Download QR code as PNG image"
			>
				{#if isDownloading}
					<span class="btn-inner">
						<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3">
							<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"/>
						</svg>
						<span>Generating PNG...</span>
					</span>
				{:else}
					<span class="btn-inner">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
						</svg>
						<span>Download QR PNG</span>
					</span>
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<style>
	.qr-modal-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		width: 100%;
		text-align: center;
	}

	.club-info-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.club-name-label {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.invite-code-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 4px 14px;
		box-shadow: 0 3px 0 var(--border-color);
	}

	.pill-label {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.pill-code {
		font-size: 1.1rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		color: var(--brand-primary);
	}

	.qr-display-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 260px;
		height: 260px;
		background-color: #ffffff;
		border: 3.5px solid var(--border-color);
		border-radius: var(--radius-lg);
		box-shadow: 0 6px 0 var(--border-color);
		padding: 12px;
		box-sizing: border-box;
	}

	.qr-svg-wrapper {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qr-svg-wrapper :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.qr-loading-placeholder,
	.qr-error-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: var(--text-muted);
		font-weight: 700;
		font-size: 0.9rem;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.invite-url-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		text-align: left;
	}

	.url-label {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.url-input {
		width: 100%;
		padding: 10px 14px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-family: monospace;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
		outline: none;
		box-shadow: 0 3px 0 var(--border-color);
		cursor: pointer;
	}

	.url-input:focus {
		border-color: var(--brand-primary);
	}

	.actions-row {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.btn-inner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	@media (min-width: 480px) {
		.actions-row {
			flex-direction: row;
		}
	}
</style>
