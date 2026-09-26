import { MAX_PDF_SIZE_BYTES } from "$lib/constants/storage";
import type { UserSession } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "./+server";

function createMockPdfEvent(options: {
	clubId: string;
	user: UserSession | null;
	body?: Record<string, unknown>;
	searchParams?: Record<string, string>;
}): RequestEvent {
	const { clubId, user, body, searchParams } = options;
	const url = new URL(`http://localhost/api/club/${clubId}/pdf`);
	if (searchParams) {
		for (const [key, value] of Object.entries(searchParams)) {
			url.searchParams.set(key, value);
		}
	}

	return {
		params: { id: clubId },
		locals: {
			user,
			env: {
				AUTH_SECRET: "test-secret",
			},
		},
		url,
		request: {
			json: async () => body ?? {},
		},
	} as unknown as RequestEvent;
}

describe("PDF Upload Endpoint Guards (POST /api/club/[id]/pdf)", () => {
	const adminUser: UserSession = {
		id: "user-admin",
		email: "admin@example.com",
		username: "club_admin",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/admin",
		createdAt: 1000,
	};

	const regularMember: UserSession = {
		id: "user-member",
		email: "member@example.com",
		username: "club_member",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/member",
		createdAt: 2000,
	};

	it("rejects unauthenticated upload requests with 401", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: null,
			body: {
				cycleId: "cycle-1",
				contentType: "application/pdf",
				fileSize: 1024 * 1024,
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Authentication required");
	});

	it("rejects non-admin members with 403 Forbidden", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: regularMember,
			body: {
				cycleId: "cycle-1",
				contentType: "application/pdf",
				fileSize: 1024 * 1024,
				userRole: "member",
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(403);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Only club administrators");
	});

	it("rejects upload when cycle is already completed", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: {
				cycleId: "cycle-completed-1",
				contentType: "application/pdf",
				fileSize: 1024 * 1024,
				cycleStatus: "completed",
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("completed or purged");
	});

	it("rejects upload when an active PDF already exists on the cycle", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: {
				cycleId: "cycle-active-1",
				contentType: "application/pdf",
				fileSize: 1024 * 1024,
				cycleStatus: "active",
				existingPdfKey: "clubs/READ-4821/cycles/cycle-active-1/existing.pdf",
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("already attached");
	});

	it("rejects upload with non-PDF MIME type", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: {
				cycleId: "cycle-active-1",
				contentType: "application/zip",
				fileSize: 1024 * 1024,
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("Only PDF documents");
	});

	it("rejects upload exceeding 25 MB size limit", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: {
				cycleId: "cycle-active-1",
				contentType: "application/pdf",
				fileSize: MAX_PDF_SIZE_BYTES + 1024,
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.error).toContain("exceeds the maximum allowed limit");
	});

	it("returns presigned upload URL and storage key on valid admin request", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: {
				cycleId: "cycle-active-1",
				contentType: "application/pdf",
				fileSize: 15 * 1024 * 1024,
				userRole: "admin",
				cycleStatus: "active",
			},
		});

		const response = await POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.uploadUrl).toBeDefined();
		expect(data.fileKey).toMatch(/^clubs\/READ-4821\/cycles\/cycle-active-1\/[a-f0-9-]+\.pdf$/);
		expect(data.expiresIn).toBe(900);
	});
});

describe("PDF Download Endpoint (GET /api/club/[id]/pdf)", () => {
	const user: UserSession = {
		id: "user-reader",
		email: "reader@example.com",
		username: "reader",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/reader",
		createdAt: 1000,
	};

	it("rejects unauthenticated download requests", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: null,
			searchParams: { fileKey: "clubs/READ-4821/cycles/c1/doc.pdf" },
		});

		const response = await GET(event);
		expect(response.status).toBe(401);
	});

	it("returns 400 when fileKey is missing", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user,
		});

		const response = await GET(event);
		expect(response.status).toBe(400);
	});

	it("returns presigned download URL on valid request", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user,
			searchParams: { fileKey: "clubs/READ-4821/cycles/c1/doc.pdf" },
		});

		const response = await GET(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.downloadUrl).toBeDefined();
	});
});

describe("PDF Deletion Endpoint (DELETE /api/club/[id]/pdf)", () => {
	const adminUser: UserSession = {
		id: "user-admin",
		email: "admin@example.com",
		username: "club_admin",
		isEmailVerified: true,
		avatarUrl: "https://gravatar.com/avatar/admin",
		createdAt: 1000,
	};

	it("rejects unauthenticated deletion", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: null,
		});

		const response = await DELETE(event);
		expect(response.status).toBe(401);
	});

	it("rejects non-admin member deletion with 403", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: { userRole: "member" },
		});

		const response = await DELETE(event);
		expect(response.status).toBe(403);
	});

	it("allows admin to remove PDF", async () => {
		const event = createMockPdfEvent({
			clubId: "READ-4821",
			user: adminUser,
			body: { userRole: "admin", fileKey: "clubs/READ-4821/cycles/c1/doc.pdf" },
		});

		const response = await DELETE(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});
});
