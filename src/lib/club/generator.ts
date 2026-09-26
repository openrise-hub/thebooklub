import { INVITE_CODE_PATTERN } from "$lib/constants/club";

const ALPHANUMERIC_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateInviteCode(): string {
	const bytes = new Uint8Array(8);
	crypto.getRandomValues(bytes);

	let raw = "";
	for (let i = 0; i < bytes.length; i++) {
		raw += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
	}

	return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function isValidGeneratedInviteCode(code: string): boolean {
	return INVITE_CODE_PATTERN.test(code);
}
