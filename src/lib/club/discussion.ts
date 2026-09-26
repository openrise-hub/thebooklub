import {
	MESSAGE_MAX_LENGTH,
	MESSAGE_MIN_LENGTH,
	PAGE_REF_BOOK_WIDE,
} from "$lib/constants/discussion";

export interface DiscussionValidationResult {
	valid: boolean;
	error?: string;
}

export function validateDiscussionMessage(
	content: string,
	pageReference: number,
	totalPages: number,
): DiscussionValidationResult {
	const trimmed = content?.trim() ?? "";

	if (trimmed.length < MESSAGE_MIN_LENGTH) {
		return {
			valid: false,
			error: "Message cannot be empty",
		};
	}

	if (trimmed.length > MESSAGE_MAX_LENGTH) {
		return {
			valid: false,
			error: `Message exceeds maximum allowed length of ${MESSAGE_MAX_LENGTH} characters`,
		};
	}

	if (
		typeof pageReference !== "number" ||
		Number.isNaN(pageReference) ||
		!Number.isFinite(pageReference)
	) {
		return {
			valid: false,
			error: "Page reference must be a valid number",
		};
	}

	if (pageReference < PAGE_REF_BOOK_WIDE) {
		return {
			valid: false,
			error: "Page reference cannot be negative",
		};
	}

	if (totalPages > 0 && pageReference > totalPages) {
		return {
			valid: false,
			error: `Page reference (${pageReference}) cannot exceed total book pages (${totalPages})`,
		};
	}

	return { valid: true };
}

export function formatPageReference(pageReference: number): string {
	if (pageReference === PAGE_REF_BOOK_WIDE) {
		return "Book-wide";
	}
	return `Page ${pageReference}`;
}

export function formatMessageTimestamp(timestamp: number, now: number = Date.now()): string {
	const diffMs = Math.max(0, now - timestamp);
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return "Just now";
	}
	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}

	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}
