<script lang="ts">
import {
	formatMessageTimestamp,
	formatPageReference,
	validateDiscussionMessage,
} from "$lib/club/discussion";
import { MESSAGE_MAX_LENGTH, PAGE_REF_BOOK_WIDE } from "$lib/constants/discussion";
import { ROUTES } from "$lib/constants/routes";
import type { UserSession } from "$lib/server/auth";
import type { DiscussionMessage, DiscussionPostResponse } from "$lib/types/discussion";
import Button from "./Button.svelte";
import Card from "./Card.svelte";
import SpoilerText from "./SpoilerText.svelte";

interface Props {
	clubId: string;
	cycleId: string;
	currentUser: UserSession | null;
	currentReadingPage?: number;
	totalPages?: number;
	initialMessages?: DiscussionMessage[];
	onMessageSent?: (message: DiscussionMessage) => void;
}

const {
	clubId,
	cycleId,
	currentUser,
	currentReadingPage = 0,
	totalPages = 1,
	initialMessages = [],
	onMessageSent,
}: Props = $props();

let messages = $state<DiscussionMessage[]>([]);
let messageText = $state("");
let pageRefInput = $state("0");
let isSubmitting = $state(false);
let errorMessage = $state<string | null>(null);

$effect(() => {
	if (initialMessages.length > 0 && messages.length === 0) {
		messages = [...initialMessages];
	}
});

$effect(() => {
	if (currentReadingPage > 0 && pageRefInput === "0") {
		pageRefInput = String(currentReadingPage);
	}
});

let charCount = $derived(messageText.length);
let isOverLimit = $derived(charCount > MESSAGE_MAX_LENGTH);

function setPageReference(page: number) {
	pageRefInput = String(page);
}

async function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	errorMessage = null;

	if (!currentUser) {
		errorMessage = "You must be signed in to post discussion messages.";
		return;
	}

	const parsedPage = Number.parseInt(pageRefInput, 10);
	const validation = validateDiscussionMessage(messageText, parsedPage, totalPages);
	if (!validation.valid) {
		errorMessage = validation.error ?? "Invalid message";
		return;
	}

	isSubmitting = true;

	try {
		const response = await fetch(ROUTES.API_CLUB_DISCUSSIONS(clubId), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: messageText.trim(),
				pageReference: parsedPage,
				cycleId,
			}),
		});

		const data: DiscussionPostResponse = await response.json();

		if (response.ok && data.success && data.message) {
			messages.push(data.message);
			messageText = "";
			errorMessage = null;
			onMessageSent?.(data.message);
		} else {
			errorMessage = data.error || "Failed to post discussion message";
		}
	} catch {
		errorMessage = "Network error. Please retry posting your message.";
	} finally {
		isSubmitting = false;
	}
}
</script>

<div class="discussion-feed" aria-label="Club Discussion Feed">
	<Card padding="md" class="discussion-input-card">
		<form onsubmit={handleSubmit} class="discussion-form" aria-label="Post a discussion comment">
			<div class="form-header">
				<div class="form-title-group">
					<span class="form-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
						</svg>
					</span>
					<h3 class="form-title">Join the Discussion</h3>
				</div>

				<div class="page-tag-selector">
					<label for="page-ref-input" class="page-tag-label">Page Tag:</label>
					<input
						type="number"
						id="page-ref-input"
						min="0"
						max={totalPages}
						bind:value={pageRefInput}
						class="page-number-input"
						aria-label="Page Reference"
					/>
					<div class="page-quick-buttons">
						<button
							type="button"
							class="quick-page-btn"
							class:active={pageRefInput === "0"}
							onclick={() => setPageReference(PAGE_REF_BOOK_WIDE)}
							aria-label="Set to Book-wide"
						>
							Book-wide
						</button>
						{#if currentReadingPage > 0}
							<button
								type="button"
								class="quick-page-btn"
								class:active={pageRefInput === String(currentReadingPage)}
								onclick={() => setPageReference(currentReadingPage)}
								aria-label="Set to current page {currentReadingPage}"
							>
								Page {currentReadingPage}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<div class="textarea-wrapper">
				<textarea
					bind:value={messageText}
					placeholder="Share your insights, questions, or reactions to this milestone..."
					rows="3"
					maxlength={MESSAGE_MAX_LENGTH + 50}
					class="message-textarea"
					class:over-limit={isOverLimit}
					aria-label="Discussion message content"
				></textarea>

				<div class="textarea-footer">
					<span class="char-counter" class:warning={charCount > MESSAGE_MAX_LENGTH - 100} class:danger={isOverLimit}>
						{charCount} / {MESSAGE_MAX_LENGTH}
					</span>
				</div>
			</div>

			{#if errorMessage}
				<div class="discussion-alert" role="alert">
					<span class="alert-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
						</svg>
					</span>
					<span class="alert-text">{errorMessage}</span>
				</div>
			{/if}

			<div class="form-actions">
				<Button
					type="submit"
					variant="purple"
					size="md"
					disabled={isSubmitting || charCount === 0 || isOverLimit}
				>
					{#if isSubmitting}
						Posting...
					{:else}
						Post Comment &rarr;
					{/if}
				</Button>
			</div>
		</form>
	</Card>

	<div class="discussion-stream" aria-label="Messages list">
		{#if messages.length === 0}
			<Card padding="lg" class="empty-discussion-card">
				<div class="empty-state">
					<span class="empty-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
							<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h10v2H7zm0-3h10v2H7z"/>
						</svg>
					</span>
					<h4 class="empty-title">No Discussion Messages Yet</h4>
					<p class="empty-desc">
						Be the first member to share a milestone thought, quote, or theory on this book!
					</p>
				</div>
			</Card>
		{:else}
			<div class="messages-list">
				{#each messages as message (message.id)}
					<Card padding="md" class="message-card">
						<div class="message-layout">
							<div class="message-avatar-container">
								<img
									src={message.avatarUrl}
									alt={message.username}
									class="message-avatar"
								/>
							</div>

							<div class="message-body">
								<div class="message-meta-row">
									<div class="author-info">
										<span class="author-name">{message.username}</span>
										<span class="message-time">{formatMessageTimestamp(message.createdAt)}</span>
									</div>

									<span
										class="page-badge"
										class:book-wide={message.pageReference === PAGE_REF_BOOK_WIDE}
										class:page-specific={message.pageReference > PAGE_REF_BOOK_WIDE}
									>
										{formatPageReference(message.pageReference)}
									</span>
								</div>

								<div class="message-text-content">
									<SpoilerText
										content={message.content}
										pageReference={message.pageReference}
										currentUserPage={currentReadingPage}
									/>
								</div>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.discussion-feed {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
	}

	:global(.discussion-input-card) {
		background-color: var(--bg-surface);
	}

	.discussion-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}

	.form-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.form-icon {
		color: var(--color-purple);
		display: flex;
		align-items: center;
	}

	.form-title {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.page-tag-selector {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.page-tag-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.page-number-input {
		width: 72px;
		padding: 6px 10px;
		border: var(--border-chunky);
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 800;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		text-align: center;
	}

	.page-quick-buttons {
		display: flex;
		gap: 6px;
	}

	.quick-page-btn {
		background-color: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.quick-page-btn:hover {
		background-color: var(--color-yellow);
		color: #000;
	}

	.quick-page-btn.active {
		background-color: var(--color-yellow);
		color: #000;
		border-color: var(--border-color);
	}

	.textarea-wrapper {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.message-textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 12px;
		border: var(--border-chunky);
		border-radius: 6px;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.95rem;
		line-height: 1.5;
		resize: vertical;
		font-family: inherit;
	}

	.message-textarea:focus {
		outline: none;
		border-color: var(--color-purple);
	}

	.message-textarea.over-limit {
		border-color: var(--color-red);
	}

	.textarea-footer {
		display: flex;
		justify-content: flex-end;
	}

	.char-counter {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.char-counter.warning {
		color: var(--color-yellow);
	}

	.char-counter.danger {
		color: var(--color-red);
	}

	.discussion-alert {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: #fee2e2;
		border: 2px solid var(--color-red);
		border-radius: 4px;
		color: #991b1b;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
	}

	.discussion-stream {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.messages-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.message-layout {
		display: flex;
		gap: 14px;
		align-items: flex-start;
	}

	.message-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: var(--border-chunky);
		object-fit: cover;
		background-color: var(--bg-surface);
	}

	.message-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.message-meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.author-name {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.message-time {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.page-badge {
		font-size: 0.75rem;
		font-weight: 800;
		padding: 3px 8px;
		border: 2px solid var(--border-color);
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.page-badge.page-specific {
		background-color: var(--color-purple);
		color: #ffffff;
	}

	.page-badge.book-wide {
		background-color: var(--bg-primary);
		color: var(--text-secondary);
	}

	.message-text-content {
		color: var(--text-primary);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.empty-icon {
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.empty-title {
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		max-width: 440px;
		margin: 0;
	}

	@media (max-width: 600px) {
		.form-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.page-tag-selector {
			width: 100%;
			justify-content: space-between;
		}

		.message-layout {
			gap: 10px;
		}

		.message-avatar {
			width: 36px;
			height: 36px;
		}
	}
</style>
