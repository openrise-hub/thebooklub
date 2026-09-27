import {
	DEFAULT_SOCIAL_CARD_FORMAT,
	SOCIAL_CARD_MIME_TYPE,
	SOCIAL_CARD_PIXEL_RATIO,
	type SocialCardFormat,
} from "$lib/constants/social";
import { toBlob, toPng } from "html-to-image";

export function sanitizeSlug(input: string): string {
	if (!input) return "club";
	return (
		input
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "club"
	);
}

export function formatSocialCardFilename(
	clubName: string,
	bookTitle: string,
	format: SocialCardFormat = DEFAULT_SOCIAL_CARD_FORMAT,
): string {
	const clubSlug = sanitizeSlug(clubName);
	const titleSlug = sanitizeSlug(bookTitle);
	return `${clubSlug}-${titleSlug}-${format}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export async function captureCardAsPng(
	element: HTMLElement,
	pixelRatio: number = SOCIAL_CARD_PIXEL_RATIO,
): Promise<Blob> {
	const blob = await toBlob(element, {
		pixelRatio,
		cacheBust: true,
		type: SOCIAL_CARD_MIME_TYPE,
	});

	if (!blob) {
		throw new Error("Failed to generate social card image blob.");
	}

	return blob;
}

export async function exportSocialCard(
	element: HTMLElement,
	clubName: string,
	bookTitle: string,
	format: SocialCardFormat = DEFAULT_SOCIAL_CARD_FORMAT,
): Promise<void> {
	const blob = await captureCardAsPng(element);
	const filename = formatSocialCardFilename(clubName, bookTitle, format);
	downloadBlob(blob, filename);
}
