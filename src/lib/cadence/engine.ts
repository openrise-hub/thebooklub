import { type CadenceType, PURGE_DELAY_MS } from "$lib/constants/cadence";
import type { CycleEvaluation, ReadingCycle } from "$lib/types/cycle";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const DAYS_PER_WEEK = 7;

export function calculateCycleEndDate(
	startDate: Date | number,
	cadence: CadenceType,
	customEndDate?: Date | number,
): number {
	const startMs = typeof startDate === "number" ? startDate : startDate.getTime();

	if (cadence === "weekly") {
		return startMs + DAYS_PER_WEEK * MS_PER_DAY;
	}

	if (cadence === "monthly") {
		const date = new Date(startMs);
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth();
		return Date.UTC(year, month + 1, 0, 23, 59, 59, 999);
	}

	if (cadence === "custom") {
		if (!customEndDate) {
			throw new Error("Custom cadence requires a valid target end date");
		}
		const endMs = typeof customEndDate === "number" ? customEndDate : customEndDate.getTime();
		if (endMs <= startMs) {
			throw new Error("Custom end date must be strictly after the start date");
		}
		return endMs;
	}

	throw new Error(`Unsupported cadence type: ${cadence}`);
}

export function evaluateCycleState(
	cycle: ReadingCycle,
	nowMs: number = Date.now(),
): CycleEvaluation {
	const isExpired = nowMs >= cycle.endDate;
	const isPurged = cycle.status === "purged";

	let status = cycle.status;
	if (isPurged) {
		status = "purged";
	} else if (isExpired) {
		status = "completed";
	} else {
		status = "active";
	}

	const rawDiff = cycle.endDate - nowMs;
	const timeRemainingMs = Math.max(0, rawDiff);
	const isOverdue = rawDiff < 0;

	const days = Math.floor(timeRemainingMs / MS_PER_DAY);
	const hours = Math.floor((timeRemainingMs % MS_PER_DAY) / MS_PER_HOUR);
	const minutes = Math.floor((timeRemainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
	const seconds = Math.floor((timeRemainingMs % MS_PER_MINUTE) / MS_PER_SECOND);

	return {
		status,
		isExpired,
		timeRemainingMs,
		formattedRemaining: {
			days,
			hours,
			minutes,
			seconds,
			isOverdue,
		},
	};
}

export function formatCountdown(evaluation: CycleEvaluation): string {
	if (evaluation.isExpired) {
		return "Cycle Completed";
	}

	const { days, hours, minutes } = evaluation.formattedRemaining;
	if (days > 0) {
		return `${days}d ${hours}h remaining`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes}m remaining`;
	}
	return `${minutes}m remaining`;
}

export function shouldPurgeCyclePdf(cycle: ReadingCycle, nowMs: number = Date.now()): boolean {
	if (!cycle.pdfKey || cycle.status === "purged") {
		return false;
	}
	return nowMs - cycle.endDate >= PURGE_DELAY_MS;
}
