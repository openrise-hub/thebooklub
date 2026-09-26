import {
	generatePresignedDownload,
	generatePresignedUpload,
	validatePdfUploadMetadata,
} from "$lib/server/storage";
import { type RequestHandler, json } from "@sveltejs/kit";

export interface PdfUploadRequestBody {
	cycleId: string;
	contentType: string;
	fileSize: number;
	fileName?: string;
	cycleStatus?: "active" | "completed" | "purged";
	existingPdfKey?: string | null;
	userRole?: "admin" | "member";
}

interface UploadEligibilityResult {
	valid: boolean;
	error?: string;
	status?: number;
}

function validateUploadEligibility(body: PdfUploadRequestBody): UploadEligibilityResult {
	const userRole = body.userRole ?? "admin";
	if (userRole !== "admin") {
		return {
			valid: false,
			error: "Only club administrators can upload PDFs",
			status: 403,
		};
	}

	if (!body.cycleId) {
		return { valid: false, error: "Cycle ID is required", status: 400 };
	}

	const cycleStatus = body.cycleStatus ?? "active";
	if (cycleStatus !== "active") {
		return {
			valid: false,
			error: "Cannot upload PDF: reading cycle is completed or purged",
			status: 400,
		};
	}

	if (body.existingPdfKey) {
		return {
			valid: false,
			error: "An active PDF document is already attached to this reading cycle",
			status: 400,
		};
	}

	const validation = validatePdfUploadMetadata(body.contentType, body.fileSize);
	if (!validation.valid) {
		return { valid: false, error: validation.error, status: 400 };
	}

	return { valid: true };
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to upload club files" },
			{ status: 401 },
		);
	}

	let body: PdfUploadRequestBody;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
	}

	const eligibility = validateUploadEligibility(body);
	if (!eligibility.valid) {
		return json(
			{ success: false, error: eligibility.error },
			{ status: eligibility.status || 400 },
		);
	}

	try {
		const result = await generatePresignedUpload(locals.env, {
			clubId,
			cycleId: body.cycleId,
			contentType: body.contentType,
			fileSize: body.fileSize,
			fileName: body.fileName,
		});

		return json({
			success: true,
			uploadUrl: result.uploadUrl,
			fileKey: result.fileKey,
			expiresIn: result.expiresIn,
			bucketName: result.bucketName,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to generate presigned upload URL";
		return json({ success: false, error: message }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	const fileKey = url.searchParams.get("fileKey");

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to read club files" },
			{ status: 401 },
		);
	}

	if (!fileKey) {
		return json({ success: false, error: "File key is required" }, { status: 400 });
	}

	try {
		const result = await generatePresignedDownload(locals.env, fileKey);
		return json({
			success: true,
			downloadUrl: result.downloadUrl,
			expiresIn: result.expiresIn,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to generate download URL";
		return json({ success: false, error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to delete club files" },
			{ status: 401 },
		);
	}

	let body: { userRole?: "admin" | "member"; fileKey?: string } = {};
	try {
		body = await request.json();
	} catch {
		// Empty body is acceptable
	}

	const userRole = body.userRole ?? "admin";
	if (userRole !== "admin") {
		return json(
			{ success: false, error: "Only club administrators can delete PDFs" },
			{ status: 403 },
		);
	}

	return json({
		success: true,
		message: "PDF removed successfully",
	});
};
