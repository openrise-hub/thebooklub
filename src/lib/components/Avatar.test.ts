import { AVATAR_SIZE_MAP } from "$lib/constants/avatars";
import { extractInitials, getAvatarSeedColor, resolveAvatarSize } from "$lib/utils/gravatar";
import { describe, expect, it } from "vitest";

describe("Avatar Component & Resolution Logic", () => {
	it("resolves size tokens to expected pixel dimensions", () => {
		expect(resolveAvatarSize("xs")).toBe(AVATAR_SIZE_MAP.xs);
		expect(resolveAvatarSize("sm")).toBe(AVATAR_SIZE_MAP.sm);
		expect(resolveAvatarSize("md")).toBe(AVATAR_SIZE_MAP.md);
		expect(resolveAvatarSize("lg")).toBe(AVATAR_SIZE_MAP.lg);
		expect(resolveAvatarSize("xl")).toBe(AVATAR_SIZE_MAP.xl);
		expect(resolveAvatarSize("xxl")).toBe(AVATAR_SIZE_MAP.xxl);
	});

	it("extracts 2-letter uppercase initials for names", () => {
		expect(extractInitials("Frank Herbert")).toBe("FH");
		expect(extractInitials("DuneReader")).toBe("DU");
		expect(extractInitials("A")).toBe("A");
		expect(extractInitials("")).toBe("?");
	});

	it("computes deterministic seed colors for initial backgrounds", () => {
		const col1 = getAvatarSeedColor("Reader1");
		const col2 = getAvatarSeedColor("Reader1");
		const col3 = getAvatarSeedColor("Reader2");

		expect(col1).toBe(col2);
		expect(typeof col1).toBe("string");
		expect(typeof col3).toBe("string");
	});
});
