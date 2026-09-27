import fs from "node:fs";
import path from "node:path";
import {
	PROGRESS_DEBOUNCE_MS,
	PURGE_DELAY_HOURS,
	PURGE_DELAY_MS,
	SEARCH_DEBOUNCE_MS,
} from "$lib/constants/cadence";
import { MAX_CANDIDATE_BOOKS, MAX_PDF_SIZE_BYTES, MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import { MESSAGE_MAX_LENGTH } from "$lib/constants/discussion";
import {
	PRESIGNED_READ_EXPIRY_SECONDS,
	PRESIGNED_UPLOAD_EXPIRY_SECONDS,
} from "$lib/constants/storage";
import { describe, expect, it } from "vitest";

const MAX_CHUNK_SIZE_BYTES = 400 * 1024;
const MAX_NODE_SIZE_BYTES = 100 * 1024;
const FORBIDDEN_SECRET_KEYS = [
	"R2_SECRET_ACCESS_KEY",
	"CLERK_SECRET_KEY",
	"KINDE_CLIENT_SECRET",
	"CRON_SECRET",
];

function verifyDirFileSizes(dirPath: string, maxSizeBytes: number): void {
	if (!fs.existsSync(dirPath)) return;
	const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".js"));
	for (const file of files) {
		const stats = fs.statSync(path.join(dirPath, file));
		expect(stats.size).toBeLessThan(maxSizeBytes);
	}
}

function verifyNoSecretsInFile(filePath: string): void {
	const content = fs.readFileSync(filePath, "utf-8");
	for (const key of FORBIDDEN_SECRET_KEYS) {
		expect(content).not.toContain(key);
	}
}

function scanDirForSecrets(dirPath: string): void {
	if (!fs.existsSync(dirPath)) return;
	const entries = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			scanDirForSecrets(fullPath);
		} else if (entry.name.endsWith(".js")) {
			verifyNoSecretsInFile(fullPath);
		}
	}
}

describe("Production Build & Performance Verification", () => {
	it("verifies production performance constants and debounce limits", () => {
		expect(PROGRESS_DEBOUNCE_MS).toBeLessThanOrEqual(500);
		expect(SEARCH_DEBOUNCE_MS).toBeLessThanOrEqual(500);
		expect(MAX_CANDIDATE_BOOKS).toBe(12);
		expect(MIN_CANDIDATE_BOOKS).toBe(2);
		expect(MESSAGE_MAX_LENGTH).toBe(2000);
		expect(PURGE_DELAY_HOURS).toBe(24);
		expect(PURGE_DELAY_MS).toBe(24 * 60 * 60 * 1000);
	});

	it("verifies storage lifecycle and security window limits", () => {
		expect(MAX_PDF_SIZE_BYTES).toBe(25 * 1024 * 1024);
		expect(PRESIGNED_UPLOAD_EXPIRY_SECONDS).toBe(900);
		expect(PRESIGNED_READ_EXPIRY_SECONDS).toBe(3600);
	});

	it("verifies client chunks remain within size budget", () => {
		const chunksDir = path.resolve(
			process.cwd(),
			".svelte-kit/output/client/_app/immutable/chunks",
		);
		verifyDirFileSizes(chunksDir, MAX_CHUNK_SIZE_BYTES);
	});

	it("verifies route nodes remain within size budget", () => {
		const nodesDir = path.resolve(process.cwd(), ".svelte-kit/output/client/_app/immutable/nodes");
		verifyDirFileSizes(nodesDir, MAX_NODE_SIZE_BYTES);
	});

	it("verifies server secrets are not bundled into client output", () => {
		const clientOutputDir = path.resolve(process.cwd(), ".svelte-kit/output/client");
		scanDirForSecrets(clientOutputDir);
	});
});
