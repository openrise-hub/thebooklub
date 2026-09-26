<script lang="ts">
import { SEARCH_DEBOUNCE_MS } from "$lib/constants/cadence";
import { ROUTES } from "$lib/constants/routes";
import type { BookSearchResponse, NormalizedBook } from "$lib/types/book";
import Button from "./Button.svelte";
import Input from "./Input.svelte";
import Modal from "./Modal.svelte";

interface Props {
	isOpen: boolean;
	onclose: () => void;
	onselect: (book: NormalizedBook) => void;
}

let { isOpen = false, onclose, onselect }: Props = $props();

let searchQuery = $state("");
let isSearching = $state(false);
let searchResults = $state<NormalizedBook[]>([]);
let selectedBook = $state<NormalizedBook | null>(null);
let manualPageInput = $state<string>("");
let searchError = $state("");
let isManualMode = $state(false);

let manualTitle = $state("");
let manualAuthor = $state("");
let manualPages = $state<string>("");
let manualCoverUrl = $state("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

let isSelectionValid = $derived.by(() => {
	if (isManualMode) {
		const pages = Number.parseInt(manualPages, 10);
		return manualTitle.trim().length > 0 && manualAuthor.trim().length > 0 && pages > 0;
	}
	if (!selectedBook) return false;
	if (selectedBook.requiresManualPages || selectedBook.pageCount === null) {
		const pages = Number.parseInt(manualPageInput, 10);
		return !Number.isNaN(pages) && pages > 0;
	}
	return true;
});

function resetState() {
	searchQuery = "";
	isSearching = false;
	searchResults = [];
	selectedBook = null;
	manualPageInput = "";
	searchError = "";
	isManualMode = false;
	manualTitle = "";
	manualAuthor = "";
	manualPages = "";
	manualCoverUrl = "";
	if (debounceTimer) {
		clearTimeout(debounceTimer);
		debounceTimer = null;
	}
}

function handleClose() {
	resetState();
	onclose();
}

function handleSearchInput(event: Event) {
	const target = event.target as HTMLInputElement;
	searchQuery = target.value;
	selectedBook = null;
	manualPageInput = "";

	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}

	const trimmed = searchQuery.trim();
	if (trimmed.length < 2) {
		searchResults = [];
		isSearching = false;
		return;
	}

	isSearching = true;
	searchError = "";

	debounceTimer = setTimeout(async () => {
		try {
			const res = await fetch(`${ROUTES.API_BOOKS_SEARCH}?q=${encodeURIComponent(trimmed)}`);
			if (!res.ok) {
				searchError = "Search failed. Please try again.";
				searchResults = [];
				isSearching = false;
				return;
			}

			const data: BookSearchResponse = await res.json();
			searchResults = data.results || [];
		} catch {
			searchError = "Network error. Please verify your connection.";
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}, SEARCH_DEBOUNCE_MS);
}

function handleSelectBook(book: NormalizedBook) {
	selectedBook = book;
	if (book.pageCount) {
		manualPageInput = String(book.pageCount);
	} else {
		manualPageInput = "";
	}
}

function handleConfirmSelection() {
	if (isManualMode) {
		const pages = Number.parseInt(manualPages, 10);
		const customBook: NormalizedBook = {
			id: `custom-${Date.now()}`,
			title: manualTitle.trim(),
			authors: [manualAuthor.trim()],
			pageCount: pages,
			requiresManualPages: false,
			coverUrl: manualCoverUrl.trim() || null,
			sourceProvider: "open_library",
		};
		onselect(customBook);
		handleClose();
		return;
	}

	if (!selectedBook) return;

	let finalBook = { ...selectedBook };
	if (selectedBook.requiresManualPages || selectedBook.pageCount === null) {
		const pages = Number.parseInt(manualPageInput, 10);
		finalBook = {
			...selectedBook,
			pageCount: pages,
			requiresManualPages: false,
		};
	}

	onselect(finalBook);
	handleClose();
}
</script>

<Modal
	{isOpen}
	title={isManualMode ? "Manual Book Entry" : "Discover & Select Book"}
	onclose={handleClose}
>
	<div class="search-modal-body">
		{#if !isManualMode}
			<div class="search-bar-wrap">
				<Input
					id="book-search-input"
					label="Search Catalog"
					placeholder="Search by title, author, or ISBN..."
					bind:value={searchQuery}
					oninput={handleSearchInput}
					autocomplete="off"
				/>
			</div>

			{#if isSearching}
				<div class="search-status loading" role="status">
					<span class="status-spinner" aria-hidden="true">⏳</span>
					<span>Searching Google Books & Open Library...</span>
				</div>
			{:else if searchError}
				<div class="search-status error" role="alert">
					{searchError}
				</div>
			{:else if searchResults.length > 0}
				<div class="results-container" role="listbox" aria-label="Book search results">
					{#each searchResults as book (book.id)}
						<button
							type="button"
							class="book-card-tile"
							class:selected={selectedBook?.id === book.id}
							onclick={() => handleSelectBook(book)}
						>
							<div class="book-cover-wrap">
								{#if book.coverUrl}
									<img
										src={book.coverUrl}
										alt={book.title}
										class="book-cover-img"
										loading="lazy"
									/>
								{:else}
									<div class="book-cover-placeholder" aria-hidden="true">
										<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
									</div>
								{/if}
							</div>

							<div class="book-details">
								<h4 class="book-title">{book.title}</h4>
								<p class="book-authors">{book.authors.join(", ")}</p>

								<div class="book-meta-badges">
									<span class="meta-badge provider">
										{book.sourceProvider === "google_books" ? "Google Books" : "Open Library"}
									</span>

									{#if book.pageCount}
										<span class="meta-badge pages">
											{book.pageCount} pages
										</span>
									{:else}
										<span class="meta-badge missing-pages">
											Page Count Missing
										</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{:else if searchQuery.trim().length >= 2}
				<div class="search-status empty">
					<p>No books found matching "<strong>{searchQuery}</strong>".</p>
					<Button
						variant="neutral"
						size="sm"
						onclick={() => (isManualMode = true)}
					>
						Enter Book Details Manually
					</Button>
				</div>
			{/if}

			{#if selectedBook && (selectedBook.requiresManualPages || selectedBook.pageCount === null)}
				<div class="manual-page-prompt">
					<div class="prompt-header">
						<span class="prompt-icon" aria-hidden="true">⚠️</span>
						<div class="prompt-text">
							<strong>Page count is required</strong>
							<p>This catalog entry did not include verified page numbers. Please specify the total pages.</p>
						</div>
					</div>
					<Input
						id="selected-book-pages"
						label="Total Page Count"
						type="number"
						placeholder="e.g. 350"
						bind:value={manualPageInput}
						required
					/>
				</div>
			{/if}

			<div class="manual-switch-bar">
				<button
					type="button"
					class="manual-switch-link"
					onclick={() => (isManualMode = true)}
				>
					Can't find the exact edition? Enter manually &rarr;
				</button>
			</div>
		{:else}
			<div class="manual-form-grid">
				<Input
					id="manual-title"
					label="Book Title"
					placeholder="e.g. The Left Hand of Darkness"
					bind:value={manualTitle}
					required
				/>

				<Input
					id="manual-author"
					label="Author"
					placeholder="e.g. Ursula K. Le Guin"
					bind:value={manualAuthor}
					required
				/>

				<Input
					id="manual-pages"
					label="Total Pages"
					type="number"
					placeholder="e.g. 304"
					bind:value={manualPages}
					required
				/>

				<Input
					id="manual-cover"
					label="Cover Image URL (Optional)"
					placeholder="https://example.com/cover.jpg"
					bind:value={manualCoverUrl}
				/>

				<button
					type="button"
					class="manual-switch-link"
					onclick={() => (isManualMode = false)}
				>
					&larr; Back to catalog search
				</button>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="modal-footer-actions">
			<Button variant="neutral" size="sm" onclick={handleClose}>
				Cancel
			</Button>
			<Button
				variant="purple"
				size="sm"
				disabled={!isSelectionValid}
				onclick={handleConfirmSelection}
			>
				Confirm Selection
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.search-modal-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-height: 70vh;
	}

	.search-bar-wrap {
		width: 100%;
	}

	.search-status {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 24px 16px;
		border-radius: var(--radius-md);
		border: var(--border-chunky);
		background-color: var(--bg-surface-elevated);
		font-family: var(--font-sans);
		font-weight: 700;
		text-align: center;
	}

	.search-status.loading {
		color: var(--brand-primary);
	}

	.search-status.error {
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border-color: var(--color-red-shadow);
	}

	.status-spinner {
		font-size: 1.75rem;
		animation: pulse 1.2s infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.15); }
	}

	.results-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-height: 320px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.book-card-tile {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--border-color);
		cursor: pointer;
		text-align: left;
		transition: transform 0.08s ease, background-color 0.1s ease, border-color 0.1s ease;
		min-height: 44px;
	}

	.book-card-tile:hover {
		transform: translateY(-2px);
		background-color: var(--bg-surface-elevated);
	}

	.book-card-tile.selected {
		border-color: var(--brand-primary);
		background-color: var(--bg-surface-elevated);
		box-shadow: 0 4px 0 var(--brand-shadow);
	}

	.book-cover-wrap {
		width: 48px;
		height: 68px;
		flex-shrink: 0;
		border-radius: var(--radius-sm);
		overflow: hidden;
		border: 2px solid var(--border-color);
		background-color: var(--bg-surface-elevated);
	}

	.book-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.book-cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
	}

	.book-details {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.book-title {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 1rem;
		color: var(--text-primary);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.book-authors {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.book-meta-badges {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 2px;
	}

	.meta-badge {
		font-family: var(--font-sans);
		font-weight: 800;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		border: 1.5px solid var(--border-color);
	}

	.meta-badge.provider {
		background-color: var(--brand-primary);
		color: #ffffff;
		border-color: var(--brand-shadow);
	}

	.meta-badge.pages {
		background-color: var(--color-green-base);
		color: var(--color-green-text);
		border-color: var(--color-green-shadow);
	}

	.meta-badge.missing-pages {
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border-color: var(--color-yellow-shadow);
	}

	.manual-page-prompt {
		display: flex;
		flex-direction: column;
		gap: 12px;
		background-color: var(--color-yellow-base);
		color: var(--color-yellow-text);
		border: var(--border-chunky);
		border-color: var(--color-yellow-shadow);
		border-radius: var(--radius-md);
		padding: 14px;
	}

	.prompt-header {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}

	.prompt-icon {
		font-size: 1.25rem;
	}

	.prompt-text {
		font-family: var(--font-sans);
		font-size: 0.85rem;
	}

	.prompt-text strong {
		font-size: 0.95rem;
		display: block;
		margin-bottom: 2px;
	}

	.prompt-text p {
		margin: 0;
		opacity: 0.9;
	}

	.manual-switch-bar {
		display: flex;
		justify-content: center;
		padding-top: 4px;
	}

	.manual-switch-link {
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--brand-primary);
		cursor: pointer;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		transition: background-color 0.1s ease;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}

	.manual-switch-link:hover {
		background-color: var(--bg-surface-elevated);
	}

	.manual-form-grid {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.modal-footer-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		width: 100%;
	}

	@media (max-width: 600px) {
		.results-container {
			max-height: 240px;
		}

		.book-card-tile {
			padding: 8px 10px;
		}

		.book-cover-wrap {
			width: 40px;
			height: 58px;
		}
	}
</style>
