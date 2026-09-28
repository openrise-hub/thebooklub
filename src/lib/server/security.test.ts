import { USER_TYPE_DEFAULT, USER_TYPE_PDF_UPLOADER } from "$lib/constants/auth";
import type { UserSession } from "$lib/server/auth";
import { createSessionToken, verifySessionToken } from "$lib/server/auth";
import { validateEnv } from "$lib/server/env";
import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST as cadencePost } from "../../routes/api/club/[id]/cadence/+server";
import {
	GET as discussionsGet,
	POST as discussionsPost,
} from "../../routes/api/club/[id]/discussions/+server";
import { POST as pdfPost } from "../../routes/api/club/[id]/pdf/+server";
import {
	GET as progressGet,
	POST as progressPost,
} from "../../routes/api/club/[id]/progress/+server";
import { GET as reviewsGet, POST as reviewsPost } from "../../routes/api/club/[id]/reviews/+server";
import { POST as selectionPost } from "../../routes/api/club/[id]/selection/+server";
import { POST as pollVotePost } from "../../routes/api/club/[id]/selection/poll/vote/+server";
import { POST as selectionSpinPost } from "../../routes/api/club/[id]/selection/spin/+server";

const mockAdminUser: UserSession = {
	id: "user-admin-1",
	email: "admin@club.example.com",
	username: "ClubAdmin",
	userType: USER_TYPE_PDF_UPLOADER,
	isEmailVerified: true,
	avatarUrl: "https://gravatar.com/avatar/admin",
	createdAt: Math.floor(Date.now() / 1000),
};

const mockMemberUser: UserSession = {
	id: "user-member-2",
	email: "member@club.example.com",
	username: "ClubMember",
	userType: USER_TYPE_DEFAULT,
	isEmailVerified: true,
	avatarUrl: "https://gravatar.com/avatar/member",
	createdAt: Math.floor(Date.now() / 1000),
};

function createMockEvent(options: {
	path: string;
	clubId: string;
	user: UserSession | null;
	body?: Record<string, unknown>;
	env?: Record<string, string>;
}): RequestEvent {
	const { path, clubId, user, body, env } = options;
	const url = new URL(`http://localhost${path}`);

	return {
		params: { id: clubId },
		locals: {
			user,
			env: env ?? {
				AUTH_SECRET: "test-auth-secret-32-chars-long-audit-key",
			},
		},
		url,
		request: {
			json: async () => body ?? {},
		},
	} as unknown as RequestEvent;
}

describe("Security Audit: Role-Based Access Control (RBAC)", () => {
	describe("Admin-Only Endpoints", () => {
		it("PDF Upload (/api/club/[id]/pdf) rejects unauthenticated requests with 401", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/pdf",
				clubId: "CLUB-1",
				user: null,
				body: {
					cycleId: "cycle-1",
					contentType: "application/pdf",
					fileSize: 1024 * 500,
				},
			});

			const response = await pdfPost(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
		});

		it("PDF Upload (/api/club/[id]/pdf) rejects non-admin members with 403", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/pdf",
				clubId: "CLUB-1",
				user: mockMemberUser,
				body: {
					cycleId: "cycle-1",
					contentType: "application/pdf",
					fileSize: 1024 * 500,
					userRole: "member",
				},
			});

			const response = await pdfPost(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Only authorized uploaders");
		});

		it("Cadence Update (/api/club/[id]/cadence) rejects unauthenticated requests with 401", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/cadence",
				clubId: "CLUB-1",
				user: null,
				body: { endDate: Date.now() + 86400000 },
			});

			const response = await cadencePost(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.success).toBe(false);
		});

		it("Cadence Update (/api/club/[id]/cadence) rejects non-admin members with 403", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/cadence",
				clubId: "CLUB-1",
				user: mockMemberUser,
				body: {
					endDate: Date.now() + 86400000,
					userRole: "member",
				},
			});

			const response = await cadencePost(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.success).toBe(false);
			expect(data.error).toContain("Only club administrators");
		});

		it("Selection Setup (/api/club/[id]/selection) rejects unauthenticated requests with 401", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/selection",
				clubId: "CLUB-1",
				user: null,
				body: {
					mode: "roulette",
					candidates: [
						{ title: "Book A", author: "Author A", totalPages: 100 },
						{ title: "Book B", author: "Author B", totalPages: 200 },
					],
				},
			});

			const response = await selectionPost(event);
			expect(response.status).toBe(401);
		});

		it("Selection Setup (/api/club/[id]/selection) rejects non-admin members with 403", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/selection",
				clubId: "CLUB-1",
				user: mockMemberUser,
				body: {
					mode: "roulette",
					userRole: "member",
					candidates: [
						{ title: "Book A", author: "Author A", totalPages: 100 },
						{ title: "Book B", author: "Author B", totalPages: 200 },
					],
				},
			});

			const response = await selectionPost(event);
			expect(response.status).toBe(403);
		});

		it("Roulette Spin (/api/club/[id]/selection/spin) rejects unauthenticated requests with 401", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/selection/spin",
				clubId: "CLUB-1",
				user: null,
				body: {
					candidates: [
						{ id: "1", title: "Book 1", author: "A1", totalPages: 100 },
						{ id: "2", title: "Book 2", author: "A2", totalPages: 200 },
					],
				},
			});

			const response = await selectionSpinPost(event);
			expect(response.status).toBe(401);
		});

		it("Roulette Spin (/api/club/[id]/selection/spin) rejects non-admin members with 403", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/selection/spin",
				clubId: "CLUB-1",
				user: mockMemberUser,
				body: {
					userRole: "member",
					candidates: [
						{ id: "1", title: "Book 1", author: "A1", totalPages: 100 },
						{ id: "2", title: "Book 2", author: "A2", totalPages: 200 },
					],
				},
			});

			const response = await selectionSpinPost(event);
			expect(response.status).toBe(403);
		});
	});

	describe("Authenticated Member Endpoints", () => {
		it("Poll Vote (/api/club/[id]/selection/poll/vote) rejects unauthenticated requests with 401", async () => {
			const event = createMockEvent({
				path: "/api/club/CLUB-1/selection/poll/vote",
				clubId: "CLUB-1",
				user: null,
				body: { candidateId: "cand-1" },
			});

			const response = await pollVotePost(event);
			expect(response.status).toBe(401);
		});

		it("Discussions GET & POST reject unauthenticated requests with 401", async () => {
			const getEvent = createMockEvent({
				path: "/api/club/CLUB-1/discussions",
				clubId: "CLUB-1",
				user: null,
			});
			const getRes = await discussionsGet(getEvent);
			expect(getRes.status).toBe(401);

			const postEvent = createMockEvent({
				path: "/api/club/CLUB-1/discussions",
				clubId: "CLUB-1",
				user: null,
				body: { content: "Hello", pageReference: 10 },
			});
			const postRes = await discussionsPost(postEvent);
			expect(postRes.status).toBe(401);
		});

		it("Progress GET & POST reject unauthenticated requests with 401", async () => {
			const getEvent = createMockEvent({
				path: "/api/club/CLUB-1/progress",
				clubId: "CLUB-1",
				user: null,
			});
			const getRes = await progressGet(getEvent);
			expect(getRes.status).toBe(401);

			const postEvent = createMockEvent({
				path: "/api/club/CLUB-1/progress",
				clubId: "CLUB-1",
				user: null,
				body: { currentPage: 50, totalPages: 200 },
			});
			const postRes = await progressPost(postEvent);
			expect(postRes.status).toBe(401);
		});

		it("Reviews GET & POST reject unauthenticated requests with 401", async () => {
			const getEvent = createMockEvent({
				path: "/api/club/CLUB-1/reviews",
				clubId: "CLUB-1",
				user: null,
			});
			const getRes = await reviewsGet(getEvent);
			expect(getRes.status).toBe(401);

			const postEvent = createMockEvent({
				path: "/api/club/CLUB-1/reviews",
				clubId: "CLUB-1",
				user: null,
				body: {
					rating: 4.5,
					comment: "Great read",
					criteria: {
						plot: 5,
						characters: 4,
						pacing: 4,
						writing: 5,
						emotion: 4,
					},
				},
			});
			const postRes = await reviewsPost(postEvent);
			expect(postRes.status).toBe(401);
		});
	});
});

describe("Security Audit: Reading Cycle Status Invariants", () => {
	it("rejects PDF upload when target cycle is completed", async () => {
		const event = createMockEvent({
			path: "/api/club/CLUB-1/pdf",
			clubId: "CLUB-1",
			user: mockAdminUser,
			body: {
				cycleId: "cycle-completed-1",
				cycleStatus: "completed",
				contentType: "application/pdf",
				fileSize: 1024 * 500,
			},
		});

		const response = await pdfPost(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("completed or purged");
	});

	it("rejects PDF upload when target cycle is purged", async () => {
		const event = createMockEvent({
			path: "/api/club/CLUB-1/pdf",
			clubId: "CLUB-1",
			user: mockAdminUser,
			body: {
				cycleId: "cycle-purged-1",
				cycleStatus: "purged",
				contentType: "application/pdf",
				fileSize: 1024 * 500,
			},
		});

		const response = await pdfPost(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("completed or purged");
	});

	it("rejects PDF upload when an active PDF is already attached to cycle", async () => {
		const event = createMockEvent({
			path: "/api/club/CLUB-1/pdf",
			clubId: "CLUB-1",
			user: mockAdminUser,
			body: {
				cycleId: "cycle-1",
				cycleStatus: "active",
				existingPdfKey: "clubs/CLUB-1/cycle-1/book.pdf",
				contentType: "application/pdf",
				fileSize: 1024 * 500,
			},
		});

		const response = await pdfPost(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("already attached");
	});
});

describe("Security Audit: Cryptographic Token Tamper Resistance", () => {
	const testSecret = "super-secret-hmac-sha256-verification-key-12345";

	it("verifies untampered token generated with secret", async () => {
		const token = await createSessionToken(mockAdminUser, testSecret);
		const session = await verifySessionToken(token, testSecret);

		expect(session).not.toBeNull();
		expect(session?.id).toBe(mockAdminUser.id);
		expect(session?.email).toBe(mockAdminUser.email);
		expect(session?.username).toBe(mockAdminUser.username);
		expect(session?.userType).toBe(mockAdminUser.userType);
	});

	it("rejects token with altered payload bytes", async () => {
		const token = await createSessionToken(mockAdminUser, testSecret);
		const [payload, signature] = token.split(".");

		const decoded = JSON.parse(atob(payload));
		decoded.username = "HackedAdmin";
		const alteredPayload = btoa(JSON.stringify(decoded));
		const tamperedToken = `${alteredPayload}.${signature}`;

		const session = await verifySessionToken(tamperedToken, testSecret);
		expect(session).toBeNull();
	});

	it("rejects token with altered signature characters", async () => {
		const token = await createSessionToken(mockAdminUser, testSecret);
		const [payload, signature] = token.split(".");

		const tamperedSig = `${signature.slice(0, -4)}ffff`;
		const tamperedToken = `${payload}.${tamperedSig}`;

		const session = await verifySessionToken(tamperedToken, testSecret);
		expect(session).toBeNull();
	});

	it("rejects token signed with an unauthorized secret", async () => {
		const token = await createSessionToken(mockAdminUser, testSecret);
		const intruderSecret = "intruder-unauthorized-secret-key-99999";

		const session = await verifySessionToken(token, intruderSecret);
		expect(session).toBeNull();
	});

	it("rejects expired token beyond max session duration", async () => {
		const expiredSession: UserSession = {
			...mockAdminUser,
			createdAt: Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60, // 31 days old
		};

		const token = await createSessionToken(expiredSession, testSecret);
		const session = await verifySessionToken(token, testSecret);

		expect(session).toBeNull();
	});
});

describe("Security Audit: Environment Isolation & Secret Protection", () => {
	it("ensures validateEnv safely encapsulates secrets with defaults", () => {
		const parsed = validateEnv({});
		expect(parsed.AUTH_SECRET).toBeDefined();
		expect(parsed.AUTH_PROVIDER).toBe("local");
		expect(parsed.R2_SECRET_ACCESS_KEY).toBeUndefined();
	});

	it("ensures validateEnv parses sensitive R2, auth and cron keys without exposure", () => {
		const parsed = validateEnv({
			AUTH_SECRET: "custom-secret-key-32-characters-min-length",
			AUTH_PROVIDER: "local",
			R2_ACCOUNT_ID: "acc_123",
			R2_ACCESS_KEY_ID: "key_id_456",
			R2_SECRET_ACCESS_KEY: "secret_access_789",
			CRON_SECRET: "cron_secret_000",
		});

		expect(parsed.AUTH_SECRET).toBe("custom-secret-key-32-characters-min-length");
		expect(parsed.R2_ACCOUNT_ID).toBe("acc_123");
		expect(parsed.R2_ACCESS_KEY_ID).toBe("key_id_456");
		expect(parsed.R2_SECRET_ACCESS_KEY).toBe("secret_access_789");
		expect(parsed.CRON_SECRET).toBe("cron_secret_000");
	});
});
