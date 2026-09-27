import { describe, expect, it } from "vitest";
import {
	AVATAR_FALLBACK_MODES,
	AVATAR_SIZE_MAP,
	DEFAULT_AVATAR_FALLBACK,
	DEFAULT_AVATAR_SIZE,
} from "./avatars";
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
import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH, PAGE_REF_BOOK_WIDE } from "./discussion";
import { DEFAULT_EXPORT_FORMAT, EXPORT_FORMATS, EXPORT_MIME_TYPES } from "./export";
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_MAX_AGE_SECONDS,
	LOCALE_COOKIE_NAME,
	LOCALE_LABELS,
	SUPPORTED_LOCALES,
} from "./i18n";
import {
	COPY_FEEDBACK_DURATION_MS,
	QR_CODE_COLORS,
	QR_CODE_DEFAULT_MARGIN,
	QR_CODE_DEFAULT_WIDTH,
	QR_CODE_ERROR_CORRECTION_LEVEL,
	QR_CODE_HIGH_RES_WIDTH,
} from "./qr";
import {
	ADVANCED_CRITERIA_KEYS,
	CRITERIA_MAX_SCORE,
	CRITERIA_METADATA,
	CRITERIA_MIN_SCORE,
	REVIEW_COMMENT_MAX_LENGTH,
	STAR_MAX_RATING,
	STAR_MIN_RATING,
	STAR_STEP_INCREMENT,
} from "./ratings";
import { ROUTES } from "./routes";
import {
	DEFAULT_POLL_HOURS,
	DEFAULT_SELECTION_MODE,
	POLL_DURATION_PRESETS_HOURS,
	POLL_TICK_INTERVAL_MS,
	ROULETTE_EASING_CSS,
	ROULETTE_MIN_ROTATIONS,
	ROULETTE_POINTER_ANGLE_DEG,
	SELECTION_COLOR_PALETTE,
	SELECTION_MODES,
	SELECTION_STATUSES,
	SELECTION_THEME_COLORS,
} from "./selection";
import {
	DEFAULT_SOCIAL_CARD_FORMAT,
	SOCIAL_CARD_DIMENSIONS,
	SOCIAL_CARD_FORMATS,
	SOCIAL_CARD_MAX_QUOTE_LENGTH,
	SOCIAL_CARD_MIME_TYPE,
	SOCIAL_CARD_PIXEL_RATIO,
} from "./social";
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

	it("enforces debouncing and search delay integers", () => {
		expect(PROGRESS_DEBOUNCE_MS).toBe(300);
		expect(SEARCH_DEBOUNCE_MS).toBe(350);
		expect(ROULETTE_SPIN_DURATION_MS).toBe(5000);
	});

	it("defines supported cadence types and cycle statuses", () => {
		expect(CADENCE_TYPES).toEqual(["weekly", "monthly", "custom"]);
		expect(CYCLE_STATUSES).toEqual(["active", "completed", "purged"]);
	});
});

describe("Rating & Rubric Constants", () => {
	it("enforces 1.0 to 5.0 star limits with 0.5 increments", () => {
		expect(STAR_MIN_RATING).toBe(1.0);
		expect(STAR_MAX_RATING).toBe(5.0);
		expect(STAR_STEP_INCREMENT).toBe(0.5);
	});

	it("enforces 1 to 5 criteria score limits", () => {
		expect(CRITERIA_MIN_SCORE).toBe(1);
		expect(CRITERIA_MAX_SCORE).toBe(5);
	});

	it("defines all 5 advanced criteria keys and metadata", () => {
		expect(ADVANCED_CRITERIA_KEYS).toEqual(["plot", "characters", "pacing", "writing", "emotion"]);
		expect(CRITERIA_METADATA.plot.label).toBe("Plot & Structure");
		expect(CRITERIA_METADATA.characters.label).toBe("Character Development");
		expect(CRITERIA_METADATA.pacing.label).toBe("Pacing & Flow");
		expect(CRITERIA_METADATA.writing.label).toBe("Style & Prose");
		expect(CRITERIA_METADATA.emotion.label).toBe("Emotional Resonance");
	});

	it("enforces review comment length maximum", () => {
		expect(REVIEW_COMMENT_MAX_LENGTH).toBe(1000);
	});
});

describe("Discussion & Message Constants", () => {
	it("enforces discussion comment length boundaries", () => {
		expect(MESSAGE_MIN_LENGTH).toBe(1);
		expect(MESSAGE_MAX_LENGTH).toBe(2000);
	});

	it("defines sentinel value for book-wide thoughts without specific page", () => {
		expect(PAGE_REF_BOOK_WIDE).toBe(0);
	});
});

describe("Book Search Constants", () => {
	it("defines search boundaries and query minimums", () => {
		expect(MIN_SEARCH_QUERY_LENGTH).toBe(2);
		expect(DEFAULT_SEARCH_RESULTS_LIMIT).toBe(10);
		expect(MAX_SEARCH_RESULTS_LIMIT).toBe(20);
	});

	it("defines external provider base URLs", () => {
		expect(GOOGLE_BOOKS_API_URL).toBe("https://www.googleapis.com/books/v1/volumes");
		expect(OPEN_LIBRARY_SEARCH_URL).toBe("https://openlibrary.org/search.json");
	});
});

describe("Routes Constants", () => {
	it("defines static application routes", () => {
		expect(ROUTES.HOME).toBe("/");
		expect(ROUTES.CLUB_NEW).toBe("/club/new");
		expect(ROUTES.API_BOOKS_SEARCH).toBe("/api/books/search");
		expect(ROUTES.API_AUTH).toBe("/api/auth");
	});

	it("defines dynamic parameterized routes", () => {
		expect(ROUTES.CLUB_DASHBOARD("test-club-123")).toBe("/club/test-club-123");
		expect(ROUTES.CLUB_HISTORY("test-club-123")).toBe("/club/test-club-123/history");
		expect(ROUTES.CLUB_SELECT("test-club-123")).toBe("/club/test-club-123/select");
		expect(ROUTES.API_CLUB_JOIN).toBe("/api/club/join");
		expect(ROUTES.API_CLUB_CREATE).toBe("/api/club/create");
		expect(ROUTES.API_CLUB_PROGRESS("c1")).toBe("/api/club/c1/progress");
		expect(ROUTES.API_CLUB_REVIEWS("c1")).toBe("/api/club/c1/reviews");
		expect(ROUTES.API_CLUB_PDF("c1")).toBe("/api/club/c1/pdf");
		expect(ROUTES.API_CLUB_CADENCE("c1")).toBe("/api/club/c1/cadence");
		expect(ROUTES.API_CLUB_DISCUSSIONS("c1")).toBe("/api/club/c1/discussions");
		expect(ROUTES.API_CRON_PURGE).toBe("/api/cron/purge");
	});
});

describe("UI & Theme Constants", () => {
	it("defines three tactile themes with classic default", () => {
		expect(THEMES).toEqual(["classic", "midnight", "bookshelf"]);
		expect(DEFAULT_THEME).toBe("classic");
	});

	it("defines client storage keys", () => {
		expect(STORAGE_KEYS.THEME).toBe("thebooklub_theme");
		expect(STORAGE_KEYS.PENDING_CLUB_CODE).toBe("pending_club_code");
		expect(STORAGE_KEYS.READER_PAGE("club-99")).toBe("reader_page_club-99");
	});

	it("defines universal action color variants", () => {
		expect(ACTION_COLOR_VARIANTS).toEqual(["red", "blue", "yellow", "green", "purple"]);
	});
});

describe("Storage & PDF Constants", () => {
	it("enforces 25MB PDF file size cap and mime whitelist", () => {
		expect(MAX_PDF_SIZE_MB).toBe(25);
		expect(STORAGE_MAX_PDF_SIZE_BYTES).toBe(25 * 1024 * 1024);
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

describe("Avatar Constants", () => {
	it("defines supported avatar sizes and fallback modes", () => {
		expect(AVATAR_SIZE_MAP.xs).toBe(24);
		expect(AVATAR_SIZE_MAP.sm).toBe(32);
		expect(AVATAR_SIZE_MAP.md).toBe(40);
		expect(AVATAR_SIZE_MAP.lg).toBe(64);
		expect(AVATAR_SIZE_MAP.xl).toBe(96);
		expect(AVATAR_SIZE_MAP.xxl).toBe(120);

		expect(AVATAR_FALLBACK_MODES).toEqual([
			"retro",
			"robohash",
			"identicon",
			"mp",
			"wavatar",
			"monsterid",
		]);
		expect(DEFAULT_AVATAR_FALLBACK).toBe("retro");
		expect(DEFAULT_AVATAR_SIZE).toBe(120);
	});
});

describe("Social Constants", () => {
	it("defines social card formats, dimensions, and limits", () => {
		expect(SOCIAL_CARD_FORMATS).toEqual(["story", "post"]);
		expect(SOCIAL_CARD_DIMENSIONS.story).toEqual({
			width: 1080,
			height: 1920,
			aspectRatio: "9/16",
		});
		expect(SOCIAL_CARD_DIMENSIONS.post).toEqual({
			width: 1080,
			height: 1080,
			aspectRatio: "1/1",
		});
		expect(SOCIAL_CARD_PIXEL_RATIO).toBe(2);
		expect(SOCIAL_CARD_MAX_QUOTE_LENGTH).toBe(280);
		expect(DEFAULT_SOCIAL_CARD_FORMAT).toBe("post");
		expect(SOCIAL_CARD_MIME_TYPE).toBe("image/png");
	});
});

describe("QR Code Constants", () => {
	it("defines error correction, dimensions, and styling tokens", () => {
		expect(QR_CODE_ERROR_CORRECTION_LEVEL).toBe("M");
		expect(QR_CODE_DEFAULT_MARGIN).toBe(2);
		expect(QR_CODE_DEFAULT_WIDTH).toBe(256);
		expect(QR_CODE_HIGH_RES_WIDTH).toBe(1024);
		expect(QR_CODE_COLORS.dark).toBe("#1a1a1a");
		expect(QR_CODE_COLORS.light).toBe("#ffffff");
		expect(COPY_FEEDBACK_DURATION_MS).toBe(2000);
	});
});

describe("Export Constants", () => {
	it("defines export formats and MIME types", () => {
		expect(EXPORT_FORMATS).toEqual(["json", "csv"]);
		expect(EXPORT_MIME_TYPES.json).toBe("application/json");
		expect(EXPORT_MIME_TYPES.csv).toBe("text/csv;charset=utf-8");
		expect(DEFAULT_EXPORT_FORMAT).toBe("json");
	});
});

describe("Selection Constants", () => {
	it("defines selection modes, roulette math, poll presets, theme colors, and duration presets", () => {
		expect(SELECTION_MODES).toEqual(["roulette", "poll"]);
		expect(SELECTION_STATUSES).toEqual(["draft", "active", "completed"]);
		expect(SELECTION_THEME_COLORS).toEqual(["purple", "blue", "green", "yellow", "red"]);
		expect(SELECTION_COLOR_PALETTE.length).toBe(12);
		expect(POLL_DURATION_PRESETS_HOURS).toEqual([1, 6, 12, 24, 48, 72]);
		expect(DEFAULT_SELECTION_MODE).toBe("roulette");
		expect(DEFAULT_POLL_HOURS).toBe(24);
		expect(POLL_TICK_INTERVAL_MS).toBe(1000);
		expect(ROULETTE_MIN_ROTATIONS).toBe(5);
		expect(ROULETTE_POINTER_ANGLE_DEG).toBe(270);
		expect(ROULETTE_EASING_CSS).toBe("cubic-bezier(0.15, 0.9, 0.2, 1.0)");
		expect(ROULETTE_SPIN_DURATION_MS).toBe(5000);
	});
});

describe("i18n Constants", () => {
	it("defines supported locales, labels, and cookie token", () => {
		expect(SUPPORTED_LOCALES).toEqual(["en", "es"]);
		expect(DEFAULT_LOCALE).toBe("en");
		expect(LOCALE_COOKIE_NAME).toBe("app_locale");
		expect(LOCALE_COOKIE_MAX_AGE_SECONDS).toBe(31536000);
		expect(LOCALE_LABELS.en).toBe("English");
		expect(LOCALE_LABELS.es).toBe("Español");
	});
});
