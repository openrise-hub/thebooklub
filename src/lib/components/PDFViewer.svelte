<script lang="ts">
import { DEFAULT_ZOOM, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "$lib/constants/storage";
import { STORAGE_KEYS } from "$lib/constants/ui";
import { onDestroy, onMount } from "svelte";
import Button from "./Button.svelte";

interface PdfPageProxy {
	getViewport: (options: { scale: number }) => {
		width: number;
		height: number;
	};
	render: (options: {
		canvasContext: CanvasRenderingContext2D;
		viewport: { width: number; height: number };
	}) => RenderTask;
}

interface PdfDocumentProxy {
	numPages: number;
	getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

interface RenderTask {
	promise: Promise<void>;
	cancel: () => void;
}

interface Props {
	isOpen: boolean;
	clubId: string;
	bookTitle: string;
	bookAuthor?: string;
	pdfUrl: string;
	initialPage?: number;
	totalPages?: number;
	onclose?: () => void;
	onpagechange?: (page: number, totalPages: number) => void;
}

const {
	isOpen = false,
	clubId,
	bookTitle,
	bookAuthor = "",
	pdfUrl,
	initialPage = 1,
	totalPages = 1,
	onclose,
	onpagechange,
}: Props = $props();

let currentPage = $state(1);
let numPages = $state(1);
let zoomLevel = $state(DEFAULT_ZOOM);
let isFitToWidth = $state(false);
let isFullscreen = $state(false);
let isLoading = $state(true);
let errorMessage = $state<string | null>(null);
let pageInputValue = $state("1");

let viewerContainer = $state<HTMLDivElement | null>(null);
let canvasElement = $state<HTMLCanvasElement | null>(null);
let pdfDoc = $state<PdfDocumentProxy | null>(null);
let renderTask = $state<RenderTask | null>(null);

function clampPage(page: number, max: number): number {
	if (Number.isNaN(page) || page < 1) return 1;
	if (page > max) return max;
	return Math.floor(page);
}

function clampZoom(zoom: number): number {
	return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(zoom.toFixed(2))));
}

function savePageToStorage(page: number) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEYS.READER_PAGE(clubId), String(page));
	} catch {
		// Ignore storage quota errors
	}
}

function getStoredPage(): number {
	if (typeof window === "undefined") return initialPage;
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.READER_PAGE(clubId));
		if (stored) {
			const parsed = Number.parseInt(stored, 10);
			if (!Number.isNaN(parsed) && parsed >= 1) return parsed;
		}
	} catch {
		// Ignore storage access errors
	}
	return initialPage;
}

async function loadPdfDocument() {
	if (!pdfUrl || typeof window === "undefined") return;

	isLoading = true;
	errorMessage = null;

	try {
		const pdfjsLib = await import("pdfjs-dist");

		if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
			pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
		}

		const loadingTask = pdfjsLib.getDocument({
			url: pdfUrl,
			cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
			cMapPacked: true,
		});

		const doc = await loadingTask.promise;
		pdfDoc = doc as unknown as PdfDocumentProxy;
		numPages = doc.numPages;

		const storedPage = getStoredPage();
		currentPage = clampPage(storedPage, numPages);
		pageInputValue = String(currentPage);

		await renderCurrentPage();
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Failed to load PDF document";
		errorMessage = msg;
		isLoading = false;
	}
}

async function renderCurrentPage() {
	if (!pdfDoc || !canvasElement || typeof window === "undefined") {
		isLoading = false;
		return;
	}

	isLoading = true;

	try {
		if (renderTask) {
			renderTask.cancel();
			renderTask = null;
		}

		const page = await pdfDoc.getPage(currentPage);
		const canvas = canvasElement;
		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("Failed to get 2D canvas rendering context");
		}

		let scale = zoomLevel;
		if (isFitToWidth && viewerContainer) {
			const containerWidth = viewerContainer.clientWidth - 48;
			const unscaledViewport = page.getViewport({ scale: 1.0 });
			scale = Math.max(ZOOM_MIN, containerWidth / unscaledViewport.width);
		}

		const pixelRatio = window.devicePixelRatio || 1;
		const viewport = page.getViewport({ scale: scale * pixelRatio });

		canvas.width = viewport.width;
		canvas.height = viewport.height;
		canvas.style.width = `${viewport.width / pixelRatio}px`;
		canvas.style.height = `${viewport.height / pixelRatio}px`;

		const renderContext = {
			canvasContext: context,
			viewport,
		};

		const task = page.render(renderContext);
		renderTask = task;
		await task.promise;

		isLoading = false;
		pageInputValue = String(currentPage);
		savePageToStorage(currentPage);
		onpagechange?.(currentPage, numPages);
	} catch (err: unknown) {
		const errorObj = err as { name?: string };
		if (errorObj?.name !== "RenderingCancelledException") {
			errorMessage = "Failed to render document page. Please retry.";
			isLoading = false;
		}
	}
}

function goToPage(targetPage: number) {
	const clamped = clampPage(targetPage, numPages);
	if (clamped === currentPage) {
		pageInputValue = String(currentPage);
		return;
	}
	currentPage = clamped;
	pageInputValue = String(clamped);
	renderCurrentPage();
}

function handlePrevPage() {
	if (currentPage > 1) {
		goToPage(currentPage - 1);
	}
}

function handleNextPage() {
	if (currentPage < numPages) {
		goToPage(currentPage + 1);
	}
}

function handlePageInputSubmit(event: Event) {
	event.preventDefault();
	const parsed = Number.parseInt(pageInputValue, 10);
	if (!Number.isNaN(parsed)) {
		goToPage(parsed);
	} else {
		pageInputValue = String(currentPage);
	}
}

function handleZoomIn() {
	isFitToWidth = false;
	zoomLevel = clampZoom(zoomLevel + ZOOM_STEP);
	renderCurrentPage();
}

function handleZoomOut() {
	isFitToWidth = false;
	zoomLevel = clampZoom(zoomLevel - ZOOM_STEP);
	renderCurrentPage();
}

function handleToggleFitToWidth() {
	isFitToWidth = !isFitToWidth;
	renderCurrentPage();
}

function handleToggleFullscreen() {
	if (typeof document === "undefined") return;

	if (!document.fullscreenElement) {
		viewerContainer?.requestFullscreen?.().catch(() => {});
		isFullscreen = true;
	} else {
		document.exitFullscreen?.().catch(() => {});
		isFullscreen = false;
	}
}

function handleFullscreenChange() {
	if (typeof document !== "undefined") {
		isFullscreen = Boolean(document.fullscreenElement);
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (!isOpen) return;

	if (event.key === "Escape") {
		if (isFullscreen && typeof document !== "undefined") {
			document.exitFullscreen?.().catch(() => {});
		} else {
			onclose?.();
		}
		return;
	}

	if (document.activeElement?.tagName === "INPUT") return;

	if (event.key === "ArrowLeft" || event.key === "PageUp") {
		handlePrevPage();
	} else if (event.key === "ArrowRight" || event.key === "PageDown") {
		handleNextPage();
	}
}

function handleRetryFromBeginning() {
	currentPage = 1;
	pageInputValue = "1";
	loadPdfDocument();
}

$effect(() => {
	if (isOpen) {
		currentPage = initialPage;
		numPages = totalPages;
		pageInputValue = String(initialPage);
		if (pdfUrl) {
			loadPdfDocument();
		}
	}
});

onMount(() => {
	if (typeof document !== "undefined") {
		document.addEventListener("fullscreenchange", handleFullscreenChange);
	}
});

onDestroy(() => {
	if (typeof document !== "undefined") {
		document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}
	if (renderTask) {
		renderTask.cancel();
	}
});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="pdf-viewer-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="PDF Reader: {bookTitle}"
		bind:this={viewerContainer}
	>
		<header class="reader-toolbar">
			<div class="toolbar-section toolbar-left">
				<Button
					variant="neutral"
					size="sm"
					onclick={onclose}
					ariaLabel="Close reader"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
					<span class="btn-text">Close</span>
				</Button>

				<div class="book-info">
					<span class="book-title-heading">{bookTitle}</span>
					{#if bookAuthor}
						<span class="book-author-sub">{bookAuthor}</span>
					{/if}
				</div>
			</div>

			<div class="toolbar-section toolbar-center">
				<Button
					variant="neutral"
					size="sm"
					disabled={currentPage <= 1 || isLoading}
					onclick={handlePrevPage}
					ariaLabel="Previous page"
				>
					&larr; Prev
				</Button>

				<form onsubmit={handlePageInputSubmit} class="page-jumper-form">
					<label for="page-jumper-input" class="jumper-label">Page</label>
					<input
						id="page-jumper-input"
						type="number"
						min="1"
						max={numPages}
						class="jumper-input"
						bind:value={pageInputValue}
						onblur={handlePageInputSubmit}
						aria-label="Current page number"
					/>
					<span class="jumper-total">of {numPages}</span>
				</form>

				<Button
					variant="neutral"
					size="sm"
					disabled={currentPage >= numPages || isLoading}
					onclick={handleNextPage}
					ariaLabel="Next page"
				>
					Next &rarr;
				</Button>
			</div>

			<div class="toolbar-section toolbar-right">
				<div class="zoom-controls">
					<Button
						variant="neutral"
						size="sm"
						disabled={zoomLevel <= ZOOM_MIN || isLoading}
						onclick={handleZoomOut}
						ariaLabel="Zoom out"
					>
						-
					</Button>
					<span class="zoom-badge">{Math.round(zoomLevel * 100)}%</span>
					<Button
						variant="neutral"
						size="sm"
						disabled={zoomLevel >= ZOOM_MAX || isLoading}
						onclick={handleZoomIn}
						ariaLabel="Zoom in"
					>
						+
					</Button>
				</div>

				<Button
					variant={isFitToWidth ? "purple" : "neutral"}
					size="sm"
					onclick={handleToggleFitToWidth}
					ariaLabel="Fit page to width"
				>
					Fit Width
				</Button>

				<Button
					variant="neutral"
					size="sm"
					onclick={handleToggleFullscreen}
					ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
						{#if isFullscreen}
							<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/>
						{:else}
							<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
						{/if}
					</svg>
				</Button>
			</div>
		</header>

		<main class="reader-canvas-container">
			{#if errorMessage}
				<div class="reader-error-card">
					<div class="error-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
					</div>
					<h3 class="error-title">Document Error</h3>
					<p class="error-description">{errorMessage}</p>
					<div class="error-actions">
						<Button variant="purple" size="md" onclick={handleRetryFromBeginning}>
							Reload Document from Page 1
						</Button>
						{#if onclose}
							<Button variant="neutral" size="md" onclick={onclose}>
								Exit Reader
							</Button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="canvas-scroll-viewport">
					<div class="canvas-wrapper" class:loading={isLoading}>
						<canvas bind:this={canvasElement} class="pdf-canvas"></canvas>
						{#if isLoading}
							<div class="canvas-loading-spinner" aria-label="Rendering page...">
								<div class="chunky-spinner"></div>
								<span class="loading-text">Loading Page {currentPage}...</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	.pdf-viewer-overlay {
		position: fixed;
		inset: 0;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.reader-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		background-color: var(--bg-surface);
		border-bottom: var(--border-chunky);
		gap: 12px;
		flex-wrap: wrap;
		z-index: 20;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.toolbar-left {
		min-width: 0;
		flex: 1 1 240px;
	}

	.btn-text {
		font-family: var(--font-sans);
		font-weight: 800;
	}

	.book-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.book-title-heading {
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-author-sub {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toolbar-center {
		justify-content: center;
		flex: 1 1 auto;
	}

	.page-jumper-form {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.85rem;
	}

	.jumper-label {
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.jumper-input {
		width: 54px;
		padding: 4px 6px;
		text-align: center;
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 0.9rem;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		box-shadow: 0 2px 0 var(--border-color);
	}

	.jumper-input:focus {
		outline: none;
		border-color: var(--brand-primary);
		box-shadow: 0 2px 0 var(--brand-shadow);
	}

	.jumper-total {
		color: var(--text-muted);
	}

	.toolbar-right {
		justify-content: flex-end;
		flex: 1 1 auto;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.zoom-badge {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.8rem;
		min-width: 44px;
		text-align: center;
		color: var(--text-primary);
	}

	.reader-canvas-container {
		flex: 1;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		background-color: var(--bg-surface-elevated);
	}

	.canvas-scroll-viewport {
		width: 100%;
		height: 100%;
		overflow: auto;
		display: flex;
		justify-content: center;
		padding: 24px;
	}

	.canvas-wrapper {
		position: relative;
		border: var(--border-chunky);
		border-radius: var(--radius-sm);
		box-shadow: 0 8px 0 var(--border-color);
		background-color: #ffffff;
		margin: auto;
		display: inline-block;
	}

	.pdf-canvas {
		display: block;
	}

	.canvas-loading-spinner {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		z-index: 10;
	}

	.chunky-spinner {
		width: 36px;
		height: 36px;
		border: 4px solid #ffffff;
		border-top-color: var(--brand-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-text {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.9rem;
		color: #ffffff;
		text-shadow: 0 2px 0 rgba(0, 0, 0, 0.8);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.reader-error-card {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 6px 0 var(--border-color);
		padding: 32px 24px;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 12px;
	}

	.error-icon {
		color: var(--color-red-base);
	}

	.error-title {
		font-family: var(--font-sans);
		font-weight: 900;
		font-size: 1.25rem;
		text-transform: uppercase;
		color: var(--text-primary);
		margin: 0;
	}

	.error-description {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.error-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.reader-toolbar {
			flex-direction: column;
			align-items: stretch;
			gap: 8px;
			padding: 8px 12px;
		}

		.toolbar-left,
		.toolbar-center,
		.toolbar-right {
			justify-content: space-between;
			width: 100%;
		}

		.canvas-scroll-viewport {
			padding: 8px;
		}
	}
</style>
