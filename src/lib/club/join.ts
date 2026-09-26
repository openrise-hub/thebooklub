import { browser } from "$app/environment";
import { STORAGE_KEYS } from "$lib/constants/ui";
import { validateInviteCode } from "./validation";

export function getPendingClubCode(): string | null {
	if (!browser) return null;
	return sessionStorage.getItem(STORAGE_KEYS.PENDING_CLUB_CODE);
}

export function setPendingClubCode(code: string): void {
	if (!browser) return;
	const validation = validateInviteCode(code);
	if (validation.valid) {
		sessionStorage.setItem(STORAGE_KEYS.PENDING_CLUB_CODE, validation.normalized);
	}
}

export function clearPendingClubCode(): void {
	if (!browser) return;
	sessionStorage.removeItem(STORAGE_KEYS.PENDING_CLUB_CODE);
}

export interface JoinClubResponse {
	success: boolean;
	clubId?: string;
	redirectUrl?: string;
	error?: string;
}

export async function resolvePendingClubJoin(
	customFetch: typeof fetch = fetch,
): Promise<JoinClubResponse | null> {
	const pendingCode = getPendingClubCode();
	if (!pendingCode) return null;

	const validation = validateInviteCode(pendingCode);
	if (!validation.valid) {
		clearPendingClubCode();
		return null;
	}

	try {
		const res = await customFetch("/api/club/join", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code: validation.normalized }),
		});

		const data: JoinClubResponse = await res.json();

		if (res.ok && data.success) {
			clearPendingClubCode();
			return data;
		}

		return {
			success: false,
			error: data.error || "Failed to join club",
		};
	} catch {
		return {
			success: false,
			error: "Network error while joining club",
		};
	}
}
