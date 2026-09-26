import {
	ALLOWED_PDF_MIME_TYPES,
	MAX_PDF_SIZE_BYTES,
	PRESIGNED_READ_EXPIRY_SECONDS,
	PRESIGNED_UPLOAD_EXPIRY_SECONDS,
	R2_DEFAULT_REGION,
} from "$lib/constants/storage";
import type { ServerEnv } from "./env";

export interface R2Config {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	endpoint?: string;
	publicUrl?: string;
	region?: string;
}

export interface PresignedUploadOptions {
	clubId: string;
	cycleId: string;
	contentType: string;
	fileSize: number;
	fileName?: string;
	expiresIn?: number;
}

export interface PresignedUploadResult {
	uploadUrl: string;
	fileKey: string;
	expiresIn: number;
	bucketName: string;
}

export interface PresignedDownloadResult {
	downloadUrl: string;
	expiresIn: number;
}

export interface StorageValidationResult {
	valid: boolean;
	error?: string;
}

export function validatePdfUploadMetadata(
	contentType: string,
	fileSize: number,
): StorageValidationResult {
	if (!ALLOWED_PDF_MIME_TYPES.includes(contentType as (typeof ALLOWED_PDF_MIME_TYPES)[number])) {
		return {
			valid: false,
			error: "Only PDF documents (application/pdf) are supported.",
		};
	}

	if (fileSize <= 0) {
		return {
			valid: false,
			error: "File size must be greater than zero bytes.",
		};
	}

	if (fileSize > MAX_PDF_SIZE_BYTES) {
		return {
			valid: false,
			error: `File size exceeds the maximum allowed limit of ${MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.`,
		};
	}

	return { valid: true };
}

export function createPdfStorageKey(clubId: string, cycleId: string): string {
	const sanitizedClub = clubId.replace(/[^a-zA-Z0-9_-]/g, "");
	const sanitizedCycle = cycleId.replace(/[^a-zA-Z0-9_-]/g, "");
	const fileId = crypto.randomUUID();
	return `clubs/${sanitizedClub}/cycles/${sanitizedCycle}/${fileId}.pdf`;
}

export function getR2Config(env: ServerEnv): R2Config | null {
	if (
		!env.R2_ACCOUNT_ID ||
		!env.R2_ACCESS_KEY_ID ||
		!env.R2_SECRET_ACCESS_KEY ||
		!env.R2_BUCKET_NAME
	) {
		return null;
	}

	return {
		accountId: env.R2_ACCOUNT_ID,
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		bucketName: env.R2_BUCKET_NAME,
		endpoint: env.R2_ENDPOINT,
		publicUrl: env.R2_PUBLIC_URL,
		region: R2_DEFAULT_REGION,
	};
}

async function sha256Hex(data: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: Uint8Array | ArrayBuffer, data: string): Promise<Uint8Array> {
	const keyBuffer =
		key instanceof Uint8Array
			? (key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer)
			: key;

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBuffer,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
	return new Uint8Array(signature);
}

async function getSigningKey(
	secretKey: string,
	dateStamp: string,
	region: string,
): Promise<Uint8Array> {
	const kSecret = new TextEncoder().encode(`AWS4${secretKey}`);
	const kDate = await hmac(kSecret, dateStamp);
	const kRegion = await hmac(kDate, region);
	const kService = await hmac(kRegion, "s3");
	return await hmac(kService, "aws4_request");
}

export async function generateAwsV4PresignedUrl(options: {
	method: "PUT" | "GET" | "DELETE";
	bucket: string;
	key: string;
	config: R2Config;
	expiresInSeconds?: number;
	contentType?: string;
	now?: Date;
}): Promise<string> {
	const {
		method,
		bucket,
		key,
		config,
		expiresInSeconds = PRESIGNED_UPLOAD_EXPIRY_SECONDS,
		contentType,
		now = new Date(),
	} = options;

	const region = config.region || R2_DEFAULT_REGION;
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
	const dateStamp = amzDate.substring(0, 8);

	const host = config.endpoint
		? new URL(config.endpoint).host
		: `${config.accountId}.r2.cloudflarestorage.com`;

	const canonicalUri = `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

	const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
	const credentialParam = `${config.accessKeyId}/${credentialScope}`;

	const signedHeaders = "host";

	const queryParams: Record<string, string> = {
		"X-Amz-Algorithm": "AWS4-HMAC-SHA256",
		"X-Amz-Credential": credentialParam,
		"X-Amz-Date": amzDate,
		"X-Amz-Expires": String(expiresInSeconds),
		"X-Amz-SignedHeaders": signedHeaders,
	};

	if (method === "PUT" && contentType) {
		queryParams["Content-Type"] = contentType;
	}

	const sortedKeys = Object.keys(queryParams).sort();
	const canonicalQueryString = sortedKeys
		.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
		.join("&");

	const canonicalHeaders = `host:${host}\n`;
	const payloadHash = "UNSIGNED-PAYLOAD";

	const canonicalRequest = [
		method,
		canonicalUri,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");

	const canonicalHash = await sha256Hex(canonicalRequest);

	const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, canonicalHash].join("\n");

	const signingKey = await getSigningKey(config.secretAccessKey, dateStamp, region);
	const signatureBytes = await hmac(signingKey, stringToSign);
	const signature = Array.from(signatureBytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	const protocol = config.endpoint?.startsWith("http://") ? "http" : "https";
	return `${protocol}://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

export async function generatePresignedUpload(
	env: ServerEnv,
	options: PresignedUploadOptions,
): Promise<PresignedUploadResult> {
	const validation = validatePdfUploadMetadata(options.contentType, options.fileSize);
	if (!validation.valid) {
		throw new Error(validation.error || "Invalid file metadata");
	}

	const fileKey = createPdfStorageKey(options.clubId, options.cycleId);
	const expiresIn = options.expiresIn ?? PRESIGNED_UPLOAD_EXPIRY_SECONDS;
	const config = getR2Config(env);

	if (!config) {
		const uploadUrl = `https://mock-r2.local/upload/${options.clubId}/${fileKey}?expires=${expiresIn}`;
		return {
			uploadUrl,
			fileKey,
			expiresIn,
			bucketName: "mock-book-club-bucket",
		};
	}

	const uploadUrl = await generateAwsV4PresignedUrl({
		method: "PUT",
		bucket: config.bucketName,
		key: fileKey,
		config,
		expiresInSeconds: expiresIn,
		contentType: options.contentType,
	});

	return {
		uploadUrl,
		fileKey,
		expiresIn,
		bucketName: config.bucketName,
	};
}

export async function generatePresignedDownload(
	env: ServerEnv,
	fileKey: string,
	expiresIn: number = PRESIGNED_READ_EXPIRY_SECONDS,
): Promise<PresignedDownloadResult> {
	const config = getR2Config(env);

	if (!config) {
		return {
			downloadUrl: `https://mock-r2.local/download/${fileKey}?expires=${expiresIn}`,
			expiresIn,
		};
	}

	if (config.publicUrl) {
		return {
			downloadUrl: `${config.publicUrl.replace(/\/$/, "")}/${fileKey}`,
			expiresIn,
		};
	}

	const downloadUrl = await generateAwsV4PresignedUrl({
		method: "GET",
		bucket: config.bucketName,
		key: fileKey,
		config,
		expiresInSeconds: expiresIn,
	});

	return {
		downloadUrl,
		expiresIn,
	};
}
