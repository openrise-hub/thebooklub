import { describe, expect, it } from "vitest";
import { generateInviteCode, isValidGeneratedInviteCode } from "./generator";

describe("generateInviteCode", () => {
	it("generates a valid 8-character invite code with hyphen", () => {
		const code = generateInviteCode();
		expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(code).toHaveLength(9);
		expect(isValidGeneratedInviteCode(code)).toBe(true);
	});

	it("generates unique codes across multiple calls", () => {
		const generated = new Set<string>();
		const count = 50;

		for (let i = 0; i < count; i++) {
			generated.add(generateInviteCode());
		}

		expect(generated.size).toBe(count);
	});
});
