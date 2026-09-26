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

export function calculateProgressPercent(currentPage: number, totalPages: number): number {
	if (totalPages <= 0 || Number.isNaN(totalPages)) return 0;
	if (currentPage <= 0 || Number.isNaN(currentPage)) return 0;
	const ratio = (currentPage / totalPages) * 100;
	return Math.min(100, Math.max(0, Math.round(ratio)));
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
