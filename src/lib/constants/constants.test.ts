import { describe, expect, it } from "vitest";
import {
	DEFAULT_SEARCH_RESULTS_LIMIT,
	GOOGLE_BOOKS_API_URL,
	MAX_SEARCH_RESULTS_LIMIT,
	MIN_SEARCH_QUERY_LENGTH,
	OPEN_LIBRARY_SEARCH_URL,
} from "./books";
import {
	CADENCE_TYPES,
	CYCLE_STATUSES,
	PROGRESS_DEBOUNCE_MS,
	PURGE_DELAY_HOURS,
	PURGE_DELAY_MS,
	ROULETTE_SPIN_DURATION_MS,
	SEARCH_DEBOUNCE_MS,
} from "./cadence";
import {
	CLUB_NAME_MAX_LENGTH,
	CLUB_NAME_MIN_LENGTH,
	DEFAULT_POLL_DURATION_HOURS,
	INVITE_CODE_LENGTH,
	INVITE_CODE_PATTERN,
	MAX_CANDIDATE_BOOKS,
	MAX_PDF_SIZE_BYTES,
	MIN_CANDIDATE_BOOKS,
} from "./club";
import {
	ADVANCED_CRITERIA_KEYS,
	CRITERIA_MAX_SCORE,
	CRITERIA_MIN_SCORE,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "./ratings";
import { ROUTES } from "./routes";
import {
	ALLOWED_PDF_MIME_TYPES,
	DEFAULT_ZOOM,
	MAX_PDF_SIZE_MB,
	PRESIGNED_READ_EXPIRY_SECONDS,
	PRESIGNED_UPLOAD_EXPIRY_SECONDS,
	MAX_PDF_SIZE_BYTES as STORAGE_MAX_PDF_SIZE_BYTES,
	ZOOM_MAX,
	ZOOM_MIN,
	ZOOM_STEP,
} from "./storage";
import { ACTION_COLOR_VARIANTS, DEFAULT_THEME, STORAGE_KEYS, THEMES } from "./ui";

describe("Club Constants", () => {
	it("enforces valid invite code length and pattern", () => {
		expect(INVITE_CODE_LENGTH).toBe(8);
		expect(INVITE_CODE_PATTERN.test("READ-4821")).toBe(true);
		expect(INVITE_CODE_PATTERN.test("READ4821")).toBe(true);
	});

	it("enforces club name boundaries", () => {
		expect(CLUB_NAME_MIN_LENGTH).toBe(3);
		expect(CLUB_NAME_MAX_LENGTH).toBe(50);
		expect(CLUB_NAME_MIN_LENGTH).toBeLessThan(CLUB_NAME_MAX_LENGTH);
	});

	it("enforces poll and candidate limits", () => {
		expect(DEFAULT_POLL_DURATION_HOURS).toBe(24);
		expect(MIN_CANDIDATE_BOOKS).toBe(2);
		expect(MAX_CANDIDATE_BOOKS).toBe(12);
		expect(MAX_PDF_SIZE_BYTES).toBe(25 * 1024 * 1024);
	});
});

describe("Cadence Constants", () => {
	it("enforces 24-hour purge delay", () => {
		expect(PURGE_DELAY_HOURS).toBe(24);
		expect(PURGE_DELAY_MS).toBe(24 * 60 * 60 * 1000);
	});

	it("defines supported cadence types and cycle statuses", () => {
		expect(CADENCE_TYPES).toEqual(["weekly", "monthly", "custom"]);
		expect(CYCLE_STATUSES).toEqual(["active", "completed", "purged"]);
	});

	it("defines UI timing thresholds", () => {
		expect(PROGRESS_DEBOUNCE_MS).toBe(300);
		expect(SEARCH_DEBOUNCE_MS).toBe(350);
		expect(ROULETTE_SPIN_DURATION_MS).toBe(5000);
	});
});

describe("Ratings Constants", () => {
	it("enforces star rating boundaries and increments", () => {
		expect(STAR_MIN_RATING).toBe(1.0);
		expect(STAR_MAX_RATING).toBe(5.0);
		expect(STAR_STEP_INCREMENT).toBe(0.5);
	});

	it("defines the 5 advanced review criteria", () => {
		expect(ADVANCED_CRITERIA_KEYS).toHaveLength(5);
		expect(ADVANCED_CRITERIA_KEYS).toEqual(["plot", "characters", "pacing", "writing", "emotion"]);
		expect(CRITERIA_MIN_SCORE).toBe(1);
		expect(CRITERIA_MAX_SCORE).toBe(5);
	});
});

describe("UI & Theme Constants", () => {
	it("defines the three supported themes", () => {
		expect(THEMES).toEqual(["classic", "midnight", "bookshelf"]);
		expect(DEFAULT_THEME).toBe("classic");
	});

	it("defines the five action color variants", () => {
		expect(ACTION_COLOR_VARIANTS).toEqual(["red", "blue", "yellow", "green", "purple"]);
	});

	it("generates correct storage keys", () => {
		expect(STORAGE_KEYS.THEME).toBe("thebooklub_theme");
		expect(STORAGE_KEYS.PENDING_CLUB_CODE).toBe("pending_club_code");
		expect(STORAGE_KEYS.READER_PAGE("c123")).toBe("reader_page_c123");
	});
});

describe("Application Routes", () => {
	it("generates static and dynamic paths", () => {
		expect(ROUTES.HOME).toBe("/");
		expect(ROUTES.CLUB_NEW).toBe("/club/new");
		expect(ROUTES.CLUB_DASHBOARD("abc")).toBe("/club/abc");
		expect(ROUTES.CLUB_HISTORY("abc")).toBe("/club/abc/history");
		expect(ROUTES.CLUB_SETTINGS("abc")).toBe("/club/abc/settings");
		expect(ROUTES.CLUB_SELECT("abc")).toBe("/club/abc/select");
		expect(ROUTES.API_BOOKS_SEARCH).toBe("/api/books/search");
		expect(ROUTES.API_CLUB_CREATE).toBe("/api/club/create");
		expect(ROUTES.API_CLUB_JOIN).toBe("/api/club/join");
		expect(ROUTES.API_CLUB_PDF("abc")).toBe("/api/club/abc/pdf");
		expect(ROUTES.API_CLUB_PROGRESS("abc")).toBe("/api/club/abc/progress");
		expect(ROUTES.API_CLUB_CADENCE("abc")).toBe("/api/club/abc/cadence");
		expect(ROUTES.API_CRON_PURGE).toBe("/api/cron/purge");
	});
});

describe("Book Discovery Constants", () => {
	it("defines query bounds and endpoints", () => {
		expect(MIN_SEARCH_QUERY_LENGTH).toBe(2);
		expect(DEFAULT_SEARCH_RESULTS_LIMIT).toBe(10);
		expect(MAX_SEARCH_RESULTS_LIMIT).toBe(20);
		expect(GOOGLE_BOOKS_API_URL).toContain("googleapis.com");
		expect(OPEN_LIBRARY_SEARCH_URL).toContain("openlibrary.org");
	});
});

describe("Storage Constants", () => {
	it("defines PDF file size limits and allowed MIME types", () => {
		expect(MAX_PDF_SIZE_MB).toBe(25);
		expect(MAX_PDF_SIZE_BYTES).toBe(25 * 1024 * 1024);
		expect(ALLOWED_PDF_MIME_TYPES).toEqual(["application/pdf"]);
	});

	it("defines presigned URL expiration windows", () => {
		expect(PRESIGNED_UPLOAD_EXPIRY_SECONDS).toBe(900);
		expect(PRESIGNED_READ_EXPIRY_SECONDS).toBe(3600);
	});

	it("defines reader zoom thresholds and step increments", () => {
		expect(DEFAULT_ZOOM).toBe(1.0);
		expect(ZOOM_MIN).toBe(0.5);
		expect(ZOOM_MAX).toBe(3.0);
		expect(ZOOM_STEP).toBe(0.25);
	});
});
