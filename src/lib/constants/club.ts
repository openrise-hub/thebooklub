/**
 * Centralized club configuration constants.
 * Strictly avoids magic numbers across club creation, joining, and validation.
 */

export const INVITE_CODE_LENGTH = 8;
export const CLUB_NAME_MIN_LENGTH = 3;
export const CLUB_NAME_MAX_LENGTH = 50;
export const DEFAULT_POLL_DURATION_HOURS = 24;
export const MIN_CANDIDATE_BOOKS = 2;
export const MAX_CANDIDATE_BOOKS = 12;
export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
