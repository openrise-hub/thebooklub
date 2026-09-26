import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN } from "$lib/constants/club";

export interface InviteCodeValidationResult {
	valid: boolean;
	error?: string;
	normalized: string;
}

export function normalizeInviteCode(input: string): string {
	const sanitized = input
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");
	if (sanitized.length <= 4) {
		return sanitized;
	}
	const firstChunk = sanitized.slice(0, 4);
	const secondChunk = sanitized.slice(4, INVITE_CODE_LENGTH);
	return secondChunk.length > 0 ? `${firstChunk}-${secondChunk}` : firstChunk;
}

export function validateInviteCode(input: string): InviteCodeValidationResult {
	const trimmed = input.trim().toUpperCase();

	if (trimmed.length === 0) {
		return {
			valid: false,
			error: "Please enter a club code to join",
			normalized: "",
		};
	}

	const alphanumericChars = trimmed.replace(/[^A-Z0-9]/g, "");

	if (alphanumericChars.length !== INVITE_CODE_LENGTH || !INVITE_CODE_PATTERN.test(trimmed)) {
		return {
			valid: false,
			error: "Invalid code format. Enter an 8-character code (e.g. READ-4821)",
			normalized: trimmed,
		};
	}

	return {
		valid: true,
		normalized: normalizeInviteCode(alphanumericChars),
	};
}
