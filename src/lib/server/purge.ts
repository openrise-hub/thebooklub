import { PURGE_DELAY_MS } from "$lib/constants/cadence";
import type { ReadingCycle } from "$lib/types/cycle";
import type { ServerEnv } from "./env";
import { deletePdfObject } from "./storage";

export interface PurgeEvaluation {
	eligible: boolean;
	isAborted: boolean;
	remainingGraceMs: number;
	reason: string;
}

export interface PurgeCycleResult {
	cycleId: string;
	clubId: string;
	pdfKey: string | null;
	action: "purged" | "skipped" | "aborted";
	reason: string;
	deletedFromStorage: boolean;
}

export interface PurgeExecutionReport {
	evaluatedCount: number;
	purgedCount: number;
	skippedCount: number;
	abortedCount: number;
	timestamp: number;
	results: PurgeCycleResult[];
	updatedCycles: ReadingCycle[];
}

export function evaluateCyclePurgeStatus(
	cycle: ReadingCycle,
	now: number = Date.now(),
): PurgeEvaluation {
	if (!cycle.pdfKey) {
		return {
			eligible: false,
			isAborted: false,
			remainingGraceMs: 0,
			reason: "No PDF file key attached to cycle",
		};
	}

	if (cycle.status === "purged") {
		return {
			eligible: false,
			isAborted: false,
			remainingGraceMs: 0,
			reason: "Cycle PDF has already been purged",
		};
	}

	if (cycle.endDate > now || cycle.status === "active") {
		return {
			eligible: false,
			isAborted: true,
			remainingGraceMs: Math.max(0, cycle.endDate + PURGE_DELAY_MS - now),
			reason: "Deadline extended or cycle is currently active (Purge Aborted)",
		};
	}

	const purgeThreshold = cycle.endDate + PURGE_DELAY_MS;
	const remainingGraceMs = purgeThreshold - now;

	if (remainingGraceMs > 0) {
		return {
			eligible: false,
			isAborted: false,
			remainingGraceMs,
			reason: `Within 24-hour grace period (${Math.ceil(remainingGraceMs / (1000 * 60 * 60))}h remaining)`,
		};
	}

	return {
		eligible: true,
		isAborted: false,
		remainingGraceMs: 0,
		reason: "24-hour post-cycle grace period expired. Ready for R2 deletion.",
	};
}

export async function purgeSingleCycle(
	env: ServerEnv,
	cycle: ReadingCycle,
	options: {
		now?: number;
		deleteFn?: typeof deletePdfObject;
	} = {},
): Promise<{ result: PurgeCycleResult; updatedCycle: ReadingCycle }> {
	const now = options.now ?? Date.now();
	const deleteFn = options.deleteFn ?? deletePdfObject;
	const evaluation = evaluateCyclePurgeStatus(cycle, now);

	if (evaluation.isAborted) {
		const updatedCycle: ReadingCycle = {
			...cycle,
			status: "active",
		};

		return {
			result: {
				cycleId: cycle.id,
				clubId: cycle.clubId,
				pdfKey: cycle.pdfKey ?? null,
				action: "aborted",
				reason: evaluation.reason,
				deletedFromStorage: false,
			},
			updatedCycle,
		};
	}

	if (!evaluation.eligible || !cycle.pdfKey) {
		return {
			result: {
				cycleId: cycle.id,
				clubId: cycle.clubId,
				pdfKey: cycle.pdfKey ?? null,
				action: "skipped",
				reason: evaluation.reason,
				deletedFromStorage: false,
			},
			updatedCycle: cycle,
		};
	}

	const fileKeyToDelete = cycle.pdfKey;
	const deleted = await deleteFn(env, fileKeyToDelete);

	const updatedCycle: ReadingCycle = {
		...cycle,
		pdfKey: null,
		status: "purged",
	};

	return {
		result: {
			cycleId: cycle.id,
			clubId: cycle.clubId,
			pdfKey: fileKeyToDelete,
			action: "purged",
			reason: "Successfully removed PDF from R2 and marked cycle as purged",
			deletedFromStorage: deleted,
		},
		updatedCycle,
	};
}

export async function runPurgeProtocol(
	env: ServerEnv,
	cycles: ReadingCycle[],
	options: {
		now?: number;
		deleteFn?: typeof deletePdfObject;
	} = {},
): Promise<PurgeExecutionReport> {
	const now = options.now ?? Date.now();
	const results: PurgeCycleResult[] = [];
	const updatedCycles: ReadingCycle[] = [];

	let purgedCount = 0;
	let skippedCount = 0;
	let abortedCount = 0;

	for (const cycle of cycles) {
		const { result, updatedCycle } = await purgeSingleCycle(env, cycle, {
			now,
			deleteFn: options.deleteFn,
		});

		results.push(result);
		updatedCycles.push(updatedCycle);

		if (result.action === "purged") {
			purgedCount++;
		} else if (result.action === "aborted") {
			abortedCount++;
		} else {
			skippedCount++;
		}
	}

	return {
		evaluatedCount: cycles.length,
		purgedCount,
		skippedCount,
		abortedCount,
		timestamp: now,
		results,
		updatedCycles,
	};
}
