import {
	MAX_PDF_SIZE_BYTES,
	PRESIGNED_READ_EXPIRY_SECONDS,
	PRESIGNED_UPLOAD_EXPIRY_SECONDS,
} from "$lib/constants/storage";
import { describe, expect, it } from "vitest";
import type { ServerEnv } from "./env";
import {
	type R2Config,
	createPdfStorageKey,
	generateAwsV4PresignedUrl,
	generatePresignedDownload,
	generatePresignedUpload,
	validatePdfUploadMetadata,
} from "./storage";

describe("Storage Validation Rules", () => {
	it("accepts valid PDF within 25 MB limit", () => {
		const result = validatePdfUploadMetadata("application/pdf", 10 * 1024 * 1024);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("rejects non-PDF MIME types", () => {
		const result = validatePdfUploadMetadata("image/png", 5 * 1024 * 1024);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Only PDF documents");
	});

	it("rejects zero-byte files", () => {
		const result = validatePdfUploadMetadata("application/pdf", 0);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("greater than zero");
	});

	it("rejects files exceeding 25 MB limit", () => {
		const result = validatePdfUploadMetadata("application/pdf", MAX_PDF_SIZE_BYTES + 1024);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("exceeds the maximum allowed limit");
	});
});

describe("Storage Key Generator", () => {
	it("constructs unique, properly structured key matching club and cycle", () => {
		const key = createPdfStorageKey("READ-4821", "cycle-100");
		expect(key).toMatch(/^clubs\/READ-4821\/cycles\/cycle-100\/[a-f0-9-]+\.pdf$/);
	});

	it("sanitizes unusual characters in club and cycle identifiers", () => {
		const key = createPdfStorageKey("READ/4821?#", "cycle.100@");
		expect(key).toMatch(/^clubs\/READ4821\/cycles\/cycle100\/[a-f0-9-]+\.pdf$/);
	});
});

describe("AWS SigV4 Presigned URL Generation", () => {
	const mockConfig: R2Config = {
		accountId: "test-account-id",
		accessKeyId: "test-access-key",
		secretAccessKey: "test-secret-key-very-secure-32chars",
		bucketName: "test-bucket",
	};

	it("generates valid AWS SigV4 PUT presigned URL with required query parameters", async () => {
		const fixedDate = new Date("2026-01-15T12:00:00Z");
		const urlString = await generateAwsV4PresignedUrl({
			method: "PUT",
			bucket: mockConfig.bucketName,
			key: "clubs/c1/cycles/cy1/doc.pdf",
			config: mockConfig,
			expiresInSeconds: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
			contentType: "application/pdf",
			now: fixedDate,
		});

		const parsedUrl = new URL(urlString);
		expect(parsedUrl.hostname).toBe("test-account-id.r2.cloudflarestorage.com");
		expect(parsedUrl.pathname).toBe("/test-bucket/clubs/c1/cycles/cy1/doc.pdf");
		expect(parsedUrl.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
		expect(parsedUrl.searchParams.get("X-Amz-Expires")).toBe("900");
		expect(parsedUrl.searchParams.get("X-Amz-Credential")).toContain("test-access-key");
		expect(parsedUrl.searchParams.get("X-Amz-Signature")).toBeDefined();
		expect(parsedUrl.searchParams.get("X-Amz-Signature")?.length).toBe(64);
	});

	it("generates valid AWS SigV4 GET presigned URL for reading", async () => {
		const urlString = await generateAwsV4PresignedUrl({
			method: "GET",
			bucket: mockConfig.bucketName,
			key: "clubs/c1/cycles/cy1/doc.pdf",
			config: mockConfig,
			expiresInSeconds: PRESIGNED_READ_EXPIRY_SECONDS,
		});

		const parsedUrl = new URL(urlString);
		expect(parsedUrl.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
		expect(parsedUrl.searchParams.get("X-Amz-Expires")).toBe("3600");
		expect(parsedUrl.searchParams.get("X-Amz-Signature")).toBeDefined();
	});
});

describe("Storage Fallback Modes", () => {
	const emptyEnv: ServerEnv = {
		AUTH_SECRET: "test-secret",
	};

	it("generates mock presigned upload URL when R2 credentials are not set", async () => {
		const result = await generatePresignedUpload(emptyEnv, {
			clubId: "READ-4821",
			cycleId: "cy-1",
			contentType: "application/pdf",
			fileSize: 1024 * 1024,
		});

		expect(result.uploadUrl).toContain("mock-r2.local");
		expect(result.fileKey).toContain("clubs/READ-4821/cycles/cy-1/");
		expect(result.expiresIn).toBe(PRESIGNED_UPLOAD_EXPIRY_SECONDS);
	});

	it("generates mock presigned download URL when R2 credentials are not set", async () => {
		const result = await generatePresignedDownload(emptyEnv, "clubs/READ-4821/cycles/cy-1/doc.pdf");

		expect(result.downloadUrl).toContain("mock-r2.local/download");
		expect(result.expiresIn).toBe(PRESIGNED_READ_EXPIRY_SECONDS);
	});
});
