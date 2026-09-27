import { PROGRESS_DEBOUNCE_MS } from "$lib/constants/cadence";
import { ROUTES } from "$lib/constants/routes";

export interface ProgressSyncPayload {
	currentPage: number;
	totalPages: number;
}

export interface ProgressSyncResponse {
	success: boolean;
	currentPage: number;
	totalPages: number;
	percent: number;
	updatedAt: number;
	error?: string;
}

export interface ProgressSynchronizerOptions {
	debounceMs?: number;
	fetchFn?: typeof fetch;
	onSync?: (result: ProgressSyncResponse) => void;
	onError?: (error: Error) => void;
}

export interface RaceMember {
	id: string;
	username: string;
	avatarUrl: string;
	currentPage: number;
}

export interface RacerGroup {
	page: number;
	percent: number;
	members: RaceMember[];
}

export function calculateProgressPercent(currentPage: number, totalPages: number): number {
	if (totalPages <= 0 || Number.isNaN(totalPages)) return 0;
	if (currentPage <= 0 || Number.isNaN(currentPage)) return 0;
	const ratio = (currentPage / totalPages) * 100;
	return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function groupMembersByPosition(members: RaceMember[], totalPages: number): RacerGroup[] {
	if (!members || members.length === 0) return [];

	const groupsMap = new Map<number, RaceMember[]>();

	for (const member of members) {
		const rawPage =
			typeof member.currentPage === "number" && !Number.isNaN(member.currentPage)
				? Math.max(0, Math.min(member.currentPage, Math.max(1, totalPages)))
				: 0;

		const existing = groupsMap.get(rawPage);
		if (existing) {
			existing.push(member);
		} else {
			groupsMap.set(rawPage, [member]);
		}
	}

	const groups: RacerGroup[] = [];
	for (const [page, groupMembers] of groupsMap.entries()) {
		groups.push({
			page,
			percent: calculateProgressPercent(page, totalPages),
			members: groupMembers,
		});
	}

	return groups.sort((a, b) => a.page - b.page);
}

export function formatRacerTooltip(
	members: RaceMember[],
	page: number,
	totalPages: number,
	percent: number,
): { title: string; subtitle: string } {
	if (!members || members.length === 0) {
		return { title: "Reader", subtitle: "Page 0 / 1 (0%)" };
	}

	let subtitle = "";
	if (page <= 0) {
		subtitle = members.length > 1 ? `${members.length} Tied • Not started` : "Not started";
	} else if (page >= totalPages && totalPages > 0) {
		subtitle =
			members.length > 1
				? `${members.length} Tied • Finished (100%)`
				: `Finished! (${page} / ${totalPages})`;
	} else {
		subtitle =
			members.length > 1
				? `${members.length} Tied • Page ${page} / ${totalPages} (${percent}%)`
				: `Page ${page} / ${totalPages} (${percent}%)`;
	}

	const title = members.map((m) => m.username).join(", ");
	return { title, subtitle };
}

export function createProgressSynchronizer(
	clubId: string | (() => string),
	options: ProgressSynchronizerOptions = {},
) {
	const getClubId = typeof clubId === "function" ? clubId : () => clubId;
	const debounceMs = options.debounceMs ?? PROGRESS_DEBOUNCE_MS;
	const customFetch = options.fetchFn ?? (typeof fetch !== "undefined" ? fetch : undefined);

	let timer: ReturnType<typeof setTimeout> | null = null;
	let pendingUpdate: ProgressSyncPayload | null = null;

	async function dispatchSync(payload: ProgressSyncPayload): Promise<ProgressSyncResponse | null> {
		if (!customFetch) return null;

		try {
			const resolvedClubId = getClubId();
			const response = await customFetch(ROUTES.API_CLUB_PROGRESS(resolvedClubId), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data: ProgressSyncResponse = await response.json();
			if (response.ok && data.success) {
				options.onSync?.(data);
			} else {
				options.onError?.(new Error(data.error || "Failed to synchronize progress"));
			}
			return data;
		} catch (err) {
			const error = err instanceof Error ? err : new Error("Network error during progress sync");
			options.onError?.(error);
			return null;
		}
	}

	function syncPage(page: number, totalPages: number) {
		const clampedPage = Math.max(0, Math.min(page, totalPages));
		pendingUpdate = { currentPage: clampedPage, totalPages };

		if (timer) {
			clearTimeout(timer);
		}

		timer = setTimeout(async () => {
			if (pendingUpdate) {
				const updateToDispatch = pendingUpdate;
				pendingUpdate = null;
				await dispatchSync(updateToDispatch);
			}
		}, debounceMs);
	}

	async function flush(): Promise<ProgressSyncResponse | null> {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}

		if (pendingUpdate) {
			const updateToDispatch = pendingUpdate;
			pendingUpdate = null;
			return await dispatchSync(updateToDispatch);
		}

		return null;
	}

	function cancel() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		pendingUpdate = null;
	}

	return {
		syncPage,
		flush,
		cancel,
	};
}
