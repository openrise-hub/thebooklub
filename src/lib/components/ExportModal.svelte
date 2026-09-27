<script lang="ts">
import { EXPORT_MIME_TYPES } from "$lib/constants/export";
import {
	type ClubExportPayload,
	downloadTextBlob,
	exportClubToJson,
	exportCyclesToCsv,
	exportProgressToCsv,
	exportReviewsToCsv,
	formatExportFilename,
} from "$lib/utils/export";
import Button from "./Button.svelte";
import Modal from "./Modal.svelte";

interface Props {
	isOpen: boolean;
	clubName: string;
	payload: ClubExportPayload;
	onclose?: () => void;
}

const { isOpen = false, clubName, payload, onclose }: Props = $props();

let exportedFormat = $state<string | null>(null);
let feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

function flashFeedback(name: string) {
	exportedFormat = name;
	if (feedbackTimeoutId) clearTimeout(feedbackTimeoutId);
	feedbackTimeoutId = setTimeout(() => {
		exportedFormat = null;
	}, 2000);
}

function handleDownloadJson() {
	const jsonStr = exportClubToJson(payload);
	const filename = formatExportFilename(clubName, "json");
	downloadTextBlob(jsonStr, filename, EXPORT_MIME_TYPES.json);
	flashFeedback("json");
}

function handleDownloadCyclesCsv() {
	const csvStr = exportCyclesToCsv(payload.cycles);
	const filename = formatExportFilename(clubName, "csv", "cycles");
	downloadTextBlob(csvStr, filename, EXPORT_MIME_TYPES.csv);
	flashFeedback("cycles");
}

function handleDownloadReviewsCsv() {
	const csvStr = exportReviewsToCsv(payload.reviews);
	const filename = formatExportFilename(clubName, "csv", "reviews");
	downloadTextBlob(csvStr, filename, EXPORT_MIME_TYPES.csv);
	flashFeedback("reviews");
}

function handleDownloadProgressCsv() {
	const csvStr = exportProgressToCsv(payload.progress);
	const filename = formatExportFilename(clubName, "csv", "progress");
	downloadTextBlob(csvStr, filename, EXPORT_MIME_TYPES.csv);
	flashFeedback("progress");
}
</script>

<Modal {isOpen} title="Export Club Data" {onclose}>
	<div class="export-modal-content">
		<div class="export-header-section">
			<h3 class="club-title">{clubName}</h3>
			<p class="export-desc">
				Download your club's reading history, reviews, and progress directly in browser memory.
			</p>

			<div class="stats-pills-row">
				<div class="stat-pill">
					<span class="stat-val">{payload?.cycles?.length ?? 0}</span>
					<span class="stat-lbl">Cycles</span>
				</div>
				<div class="stat-pill">
					<span class="stat-val">{payload?.reviews?.length ?? 0}</span>
					<span class="stat-lbl">Reviews</span>
				</div>
				<div class="stat-pill">
					<span class="stat-val">{payload?.progress?.length ?? 0}</span>
					<span class="stat-lbl">Progress</span>
				</div>
			</div>
		</div>

		<!-- JSON Section -->
		<div class="export-card primary-export">
			<div class="card-info">
				<div class="card-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
						<polyline points="10 9 9 9 8 9"/>
					</svg>
				</div>
				<div class="card-text">
					<h4 class="card-title">Complete JSON Backup</h4>
					<p class="card-subtitle">Full backup including club settings, all cycles, reviews, and reading progress.</p>
				</div>
			</div>

			<Button
				variant={exportedFormat === "json" ? "green" : "purple"}
				size="md"
				onclick={handleDownloadJson}
				ariaLabel="Download full club backup as JSON"
			>
				{#if exportedFormat === "json"}
					<span>✓ Downloaded!</span>
				{:else}
					<span>Download JSON</span>
				{/if}
			</Button>
		</div>

		<!-- CSV Section -->
		<div class="csv-section">
			<h4 class="section-title">Spreadsheet Exports (CSV)</h4>
			<div class="csv-buttons-grid">
				<div class="csv-item">
					<div class="csv-item-info">
						<span class="csv-item-title">Reading Cycles</span>
						<span class="csv-item-count">{payload?.cycles?.length ?? 0} entries</span>
					</div>
					<Button
						variant={exportedFormat === "cycles" ? "green" : "blue"}
						size="sm"
						onclick={handleDownloadCyclesCsv}
						ariaLabel="Download reading cycles as CSV"
					>
						{exportedFormat === "cycles" ? "✓ Done" : "CSV"}
					</Button>
				</div>

				<div class="csv-item">
					<div class="csv-item-info">
						<span class="csv-item-title">Reviews & Rubrics</span>
						<span class="csv-item-count">{payload?.reviews?.length ?? 0} entries</span>
					</div>
					<Button
						variant={exportedFormat === "reviews" ? "green" : "yellow"}
						size="sm"
						onclick={handleDownloadReviewsCsv}
						ariaLabel="Download reviews as CSV"
					>
						{exportedFormat === "reviews" ? "✓ Done" : "CSV"}
					</Button>
				</div>

				<div class="csv-item">
					<div class="csv-item-info">
						<span class="csv-item-title">Member Progress</span>
						<span class="csv-item-count">{payload?.progress?.length ?? 0} entries</span>
					</div>
					<Button
						variant={exportedFormat === "progress" ? "green" : "blue"}
						size="sm"
						onclick={handleDownloadProgressCsv}
						ariaLabel="Download progress as CSV"
					>
						{exportedFormat === "progress" ? "✓ Done" : "CSV"}
					</Button>
				</div>
			</div>
		</div>
	</div>
</Modal>

<style>
	.export-modal-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
	}

	.export-header-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
	}

	.club-title {
		font-size: 1.25rem;
		font-weight: 800;
	}

	.export-desc {
		font-size: 0.9rem;
		color: var(--text-muted);
		max-width: 440px;
		line-height: 1.4;
	}

	.stats-pills-row {
		display: flex;
		gap: 12px;
		margin-top: 4px;
	}

	.stat-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 4px 12px;
		box-shadow: 0 2px 0 var(--border-color);
	}

	.stat-val {
		font-weight: 900;
		color: var(--brand-primary);
		font-size: 0.95rem;
	}

	.stat-lbl {
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.export-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: var(--bg-surface-elevated);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		padding: 16px;
	}

	.card-info {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background-color: var(--brand-primary);
		color: #ffffff;
		border: 2px solid var(--border-color);
		border-radius: 10px;
		box-shadow: 0 3px 0 var(--border-color);
		flex-shrink: 0;
	}

	.card-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 800;
	}

	.card-subtitle {
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.csv-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-title {
		font-size: 0.85rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}

	.csv-buttons-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.csv-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		box-shadow: 0 3px 0 var(--border-color);
	}

	.csv-item-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.csv-item-title {
		font-size: 0.9rem;
		font-weight: 800;
	}

	.csv-item-count {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	@media (min-width: 500px) {
		.export-card {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}
</style>
