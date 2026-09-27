import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Deployment & Infrastructure Configuration", () => {
	it("validates vercel.json cron purge configuration", () => {
		const vercelConfigPath = path.resolve(process.cwd(), "vercel.json");
		expect(fs.existsSync(vercelConfigPath)).toBe(true);

		const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
		expect(vercelConfig.crons).toBeDefined();
		expect(Array.isArray(vercelConfig.crons)).toBe(true);

		const purgeCron = vercelConfig.crons.find(
			(c: { path: string }) => c.path === "/api/cron/purge",
		);
		expect(purgeCron).toBeDefined();
		expect(purgeCron?.schedule).toBe("0 * * * *");
	});

	it("validates wrangler.toml Cloudflare Pages and R2 bindings", () => {
		const wranglerPath = path.resolve(process.cwd(), "wrangler.toml");
		expect(fs.existsSync(wranglerPath)).toBe(true);

		const content = fs.readFileSync(wranglerPath, "utf-8");
		expect(content).toContain("the-book-club");
		expect(content).toContain("BOOK_PDF_STORAGE");
		expect(content).toContain("the-book-club-pdfs");
		expect(content).toContain("0 * * * *");
	});

	it("validates GitHub Actions CI pipeline configuration", () => {
		const ciPath = path.resolve(process.cwd(), ".github/workflows/ci.yml");
		expect(fs.existsSync(ciPath)).toBe(true);

		const ciContent = fs.readFileSync(ciPath, "utf-8");
		expect(ciContent).toContain("@biomejs/biome check");
		expect(ciContent).toContain("npm run check");
		expect(ciContent).toContain("npm run test");
		expect(ciContent).toContain("npm run build");
		expect(ciContent).toContain("--ignore-scripts");
	});
});
