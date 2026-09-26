import { describe, expect, it } from "vitest";
import {
	extractInitials,
	getAvatarSeedColor,
	getGravatarUrl,
	getGravatarUrlFromHash,
	hashEmail,
	normalizeEmail,
	resolveAvatarSize,
} from "./gravatar";

describe("Gravatar Utility Functions", () => {
	it("normalizes emails by trimming whitespace and converting to lowercase", () => {
		expect(normalizeEmail("   Reader@Example.COM   ")).toBe("reader@example.com");
		expect(normalizeEmail("Alice.Books@Domain.Org")).toBe("alice.books@domain.org");
	});

	it("computes reproducible SHA-256 hex hashes for email addresses", async () => {
		const hash1 = await hashEmail("reader@example.com");
		const hash2 = await hashEmail("  READER@EXAMPLE.COM ");
		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64);
		expect(hash1).toMatch(/^[a-f0-9]{64}$/);
	});

	it("resolves size names and numbers correctly", () => {
		expect(resolveAvatarSize("xs")).toBe(24);
		expect(resolveAvatarSize("sm")).toBe(32);
		expect(resolveAvatarSize("md")).toBe(40);
		expect(resolveAvatarSize("lg")).toBe(64);
		expect(resolveAvatarSize("xl")).toBe(96);
		expect(resolveAvatarSize("xxl")).toBe(120);
		expect(resolveAvatarSize(50)).toBe(50);
		expect(resolveAvatarSize(undefined)).toBe(120);
	});

	it("builds correct Gravatar URLs with configurable fallback modes and sizes", async () => {
		const url = await getGravatarUrl("test@example.com", {
			size: "md",
			fallback: "robohash",
			rating: "g",
		});

		expect(url).toContain("https://www.gravatar.com/avatar/");
		expect(url).toContain("s=40");
		expect(url).toContain("d=robohash");
		expect(url).toContain("r=g");
	});

	it("constructs Gravatar URL synchronously from known hash", () => {
		const url = getGravatarUrlFromHash("abcdef123456", {
			size: 80,
			fallback: "retro",
		});
		expect(url).toBe("https://www.gravatar.com/avatar/abcdef123456?d=retro&s=80");
	});

	it("extracts uppercase initials accurately from names", () => {
		expect(extractInitials("Alice Reader")).toBe("AR");
		expect(extractInitials("Bob")).toBe("BO");
		expect(extractInitials("John Ronald Reuel Tolkien")).toBe("JT");
		expect(extractInitials("")).toBe("?");
		expect(extractInitials("   ")).toBe("?");
	});

	it("generates deterministic background color from string seed", () => {
		const color1 = getAvatarSeedColor("AliceReader");
		const color2 = getAvatarSeedColor("AliceReader");
		expect(color1).toBe(color2);
		expect(color1).toMatch(/^var\(--/);
	});
});
