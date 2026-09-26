/**
 * Centralized Cloudflare R2 storage constants.
 * Prevents magic numbers in PDF uploads, presigned URLs, and file size validations.
 */

export const MAX_PDF_SIZE_MB = 25;
export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

export const ALLOWED_PDF_MIME_TYPES = ["application/pdf"] as const;
export type AllowedPdfMimeType = (typeof ALLOWED_PDF_MIME_TYPES)[number];

export const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 900; // 15 minutes
export const PRESIGNED_READ_EXPIRY_SECONDS = 3600; // 1 hour

export const R2_DEFAULT_REGION = "auto";
