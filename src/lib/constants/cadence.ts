/**
 * Centralized reading cycle and timing constants.
 * Avoids magic numbers in cadence timers, debounces, and purge workers.
 */

export const PURGE_DELAY_HOURS = 24;
export const PURGE_DELAY_MS = 24 * 60 * 60 * 1000;
export const PROGRESS_DEBOUNCE_MS = 300;
export const SEARCH_DEBOUNCE_MS = 350;
export const ROULETTE_SPIN_DURATION_MS = 5000;

export const CADENCE_TYPES = ["weekly", "monthly", "custom"] as const;
export type CadenceType = (typeof CADENCE_TYPES)[number];
