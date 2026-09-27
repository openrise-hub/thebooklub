import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Open-Source Release Packaging & Governance Verification", () => {
	it("verifies package.json license is GPL-3.0-or-later", () => {
		const pkgPath = path.resolve(process.cwd(), "package.json");
		expect(fs.existsSync(pkgPath)).toBe(true);

		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
		expect(pkg.license).toBe("GPL-3.0-or-later");
	});

	it("verifies LICENSE file contains GNU General Public License terms", () => {
		const licensePath = path.resolve(process.cwd(), "LICENSE");
		expect(fs.existsSync(licensePath)).toBe(true);

		const content = fs.readFileSync(licensePath, "utf-8");
		expect(content).toContain("GNU GENERAL PUBLIC LICENSE");
		expect(content).toContain("Version 3");
	});

	it("verifies .env.example contains all required ServerEnv variables", () => {
		const envExamplePath = path.resolve(process.cwd(), ".env.example");
		expect(fs.existsSync(envExamplePath)).toBe(true);

		const content = fs.readFileSync(envExamplePath, "utf-8");
		const expectedKeys = [
			"AUTH_SECRET",
			"AUTH_PROVIDER",
			"CLERK_SECRET_KEY",
			"CLERK_PUBLISHABLE_KEY",
			"KINDE_CLIENT_ID",
			"KINDE_CLIENT_SECRET",
			"KINDE_ISSUER_URL",
			"KINDE_SITE_URL",
			"DATABASE_URL",
			"DATABASE_AUTH_TOKEN",
			"R2_ACCOUNT_ID",
			"R2_ACCESS_KEY_ID",
			"R2_SECRET_ACCESS_KEY",
			"R2_BUCKET_NAME",
			"R2_ENDPOINT",
			"R2_PUBLIC_URL",
			"CRON_SECRET",
		];

		for (const key of expectedKeys) {
			expect(content).toContain(`${key}=`);
		}
	});

	it("verifies README.md contains complete architecture and setup documentation", () => {
		const readmePath = path.resolve(process.cwd(), "README.md");
		expect(fs.existsSync(readmePath)).toBe(true);

		const content = fs.readFileSync(readmePath, "utf-8");
		expect(content).toContain("The Book Club");
		expect(content).toContain("Architecture & Philosophy");
		expect(content).toContain("Zero-Cost Infrastructure Architecture");
		expect(content).toContain("Quickstart & Local Development");
		expect(content).toContain("Deployment Guide");
		expect(content).toContain("Dual-Engine Book Discovery");
		expect(content).toContain("Synchronized Roulette & Timed Secret Ballots");
		expect(content).toContain("In-Browser Canvas PDF Reader");
		expect(content).toContain("Paraglide JS");
	});

	it("verifies community governance files are present and populated", () => {
		const contributingPath = path.resolve(process.cwd(), "CONTRIBUTING.md");
		expect(fs.existsSync(contributingPath)).toBe(true);
		expect(fs.readFileSync(contributingPath, "utf-8")).toContain("Contributing to The Book Club");

		const cocPath = path.resolve(process.cwd(), "CODE_OF_CONDUCT.md");
		expect(fs.existsSync(cocPath)).toBe(true);
		expect(fs.readFileSync(cocPath, "utf-8")).toContain("Contributor Covenant Code of Conduct");

		const securityPath = path.resolve(process.cwd(), "SECURITY.md");
		expect(fs.existsSync(securityPath)).toBe(true);
		expect(fs.readFileSync(securityPath, "utf-8")).toContain("Security Policy");
	});
});
