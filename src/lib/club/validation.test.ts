import { describe, expect, it } from "vitest";
import { normalizeInviteCode, validateInviteCode } from "./validation";

describe("normalizeInviteCode", () => {
	it("normalizes lowercase alphanumeric characters with hyphen", () => {
		expect(normalizeInviteCode("read-4821")).toBe("READ-4821");
	});

	it("normalizes unhyphenated 8-character string to hyphenated format", () => {
		expect(normalizeInviteCode("read4821")).toBe("READ-4821");
	});

	it("handles partial input correctly", () => {
		expect(normalizeInviteCode("rea")).toBe("REA");
		expect(normalizeInviteCode("read4")).toBe("READ-4");
	});

	it("strips invalid special characters", () => {
		expect(normalizeInviteCode("re@ad!48#21")).toBe("READ-4821");
	});
});

describe("validateInviteCode", () => {
	it("validates correct hyphenated invite code", () => {
		const result = validateInviteCode("READ-4821");
		expect(result.valid).toBe(true);
		expect(result.normalized).toBe("READ-4821");
		expect(result.error).toBeUndefined();
	});

	it("validates correct unhyphenated invite code and normalizes it", () => {
		const result = validateInviteCode("READ4821");
		expect(result.valid).toBe(true);
		expect(result.normalized).toBe("READ-4821");
	});

	it("rejects empty input with descriptive error", () => {
		const result = validateInviteCode("   ");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Please enter a club code to join");
	});

	it("rejects codes that are too short", () => {
		const result = validateInviteCode("READ");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Invalid code format");
	});

	it("rejects codes with invalid characters", () => {
		const result = validateInviteCode("READ-482!");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Invalid code format");
	});
});
