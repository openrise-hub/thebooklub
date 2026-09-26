import { normalizeInviteCode, validateInviteCode } from "$lib/club/validation";
import { ROUTES } from "$lib/constants/routes";
import { STORAGE_KEYS } from "$lib/constants/ui";
import { describe, expect, it } from "vitest";

describe("Landing Page Logic", () => {
	it("constructs correct navigation routes for landing and onboarding", () => {
		expect(ROUTES.HOME).toBe("/");
		expect(ROUTES.CLUB_NEW).toBe("/club/new");
		expect(ROUTES.CLUB_DASHBOARD("READ-4821")).toBe("/club/READ-4821");
	});

	it("uses correct session storage key for pending club code", () => {
		expect(STORAGE_KEYS.PENDING_CLUB_CODE).toBe("pending_club_code");
	});

	it("auto-formats invite code query parameters", () => {
		const paramValue = "read-4821";
		const normalized = normalizeInviteCode(paramValue);
		expect(normalized).toBe("READ-4821");

		const validation = validateInviteCode(normalized);
		expect(validation.valid).toBe(true);
		expect(validation.normalized).toBe("READ-4821");
	});

	it("validates and formats lowercase and unhyphenated codes on submit", () => {
		const result = validateInviteCode("book4821");
		expect(result.valid).toBe(true);
		expect(result.normalized).toBe("BOOK-4821");
	});

	it("prevents submission on invalid input and returns validation message", () => {
		const result = validateInviteCode("INVALID!!");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});
});
