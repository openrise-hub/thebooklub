import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, USER_TYPE_DEFAULT } from "$lib/constants/auth";
import { type UserSession, createSessionToken, getGravatarUrl } from "$lib/server/auth";
import { hashPassword, verifyPassword } from "$lib/server/db/crypto";
import { getDb } from "$lib/server/db/index";
import { clubMembers, clubs, users } from "$lib/server/db/schema";
import { type Cookies, type RequestHandler, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

interface AuthRequestBody {
	action?: string;
	email?: string;
	password?: string;
	username?: string;
	pendingCode?: string;
}

async function joinPendingClub(
	db: Awaited<ReturnType<typeof getDb>>,
	userId: string,
	pendingCode?: string,
): Promise<void> {
	if (!pendingCode) return;
	const targetClub = await db
		.select()
		.from(clubs)
		.where(eq(clubs.inviteCode, pendingCode.toUpperCase()))
		.limit(1);

	if (targetClub.length === 0) return;

	const existingMember = await db
		.select()
		.from(clubMembers)
		.where(and(eq(clubMembers.clubId, targetClub[0].id), eq(clubMembers.userId, userId)))
		.limit(1);

	if (existingMember.length === 0) {
		await db.insert(clubMembers).values({
			id: `mem-${crypto.randomUUID().slice(0, 8)}`,
			clubId: targetClub[0].id,
			userId,
			role: "member",
			currentPage: 0,
			joinedAt: Math.floor(Date.now() / 1000),
		});
	}
}

function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set(AUTH_COOKIE_NAME, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: SESSION_MAX_AGE_SECONDS,
	});
}

async function handleRegister(
	db: Awaited<ReturnType<typeof getDb>>,
	body: AuthRequestBody,
	email: string,
	authSecret?: string,
): Promise<{ user?: UserSession; token?: string; error?: string }> {
	const username = (body.username || "").trim();
	if (!username || username.length < 2) {
		return { error: "Username must be at least 2 characters" };
	}

	const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (existing.length > 0) {
		return { error: "An account with this email already exists" };
	}

	const passwordHash = await hashPassword(body.password || "");
	const avatarUrl = await getGravatarUrl(email);
	const userId = `user-${crypto.randomUUID().slice(0, 8)}`;
	const now = Math.floor(Date.now() / 1000);
	const userType = USER_TYPE_DEFAULT;

	await db.insert(users).values({
		id: userId,
		email,
		username,
		passwordHash,
		userType,
		isEmailVerified: true,
		avatarUrl,
		createdAt: now,
	});

	await joinPendingClub(db, userId, body.pendingCode);

	const session: UserSession = {
		id: userId,
		email,
		username,
		userType,
		isEmailVerified: true,
		avatarUrl,
		createdAt: now,
	};

	const secret = authSecret || "fallback-auth-secret-for-session-tokens";
	const token = await createSessionToken(session, secret);
	return { user: session, token };
}

async function handleLogin(
	db: Awaited<ReturnType<typeof getDb>>,
	body: AuthRequestBody,
	email: string,
	authSecret?: string,
): Promise<{ user?: UserSession; token?: string; error?: string }> {
	const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (existing.length === 0) {
		return { error: "Invalid email or password" };
	}

	const userRecord = existing[0];
	const isValidPassword = await verifyPassword(body.password || "", userRecord.passwordHash);
	if (!isValidPassword) {
		return { error: "Invalid email or password" };
	}

	await joinPendingClub(db, userRecord.id, body.pendingCode);

	const session: UserSession = {
		id: userRecord.id,
		email: userRecord.email,
		username: userRecord.username,
		userType: userRecord.userType ?? USER_TYPE_DEFAULT,
		isEmailVerified: userRecord.isEmailVerified,
		avatarUrl: userRecord.avatarUrl,
		createdAt: Math.floor(Date.now() / 1000),
	};

	const secret = authSecret || "fallback-auth-secret-for-session-tokens";
	const token = await createSessionToken(session, secret);
	return { user: session, token };
}

function validateCredentials(email: string, password: string): string | null {
	if (!email || !email.includes("@")) {
		return "Please enter a valid email address";
	}
	if (!password || password.length < 6) {
		return "Password must be at least 6 characters";
	}
	return null;
}

async function executeAuthAction(
	db: Awaited<ReturnType<typeof getDb>>,
	body: AuthRequestBody,
	email: string,
	authSecret?: string,
): Promise<{ user?: UserSession; token?: string; error?: string }> {
	const action = body.action || "login";
	if (action === "register") {
		return handleRegister(db, body, email, authSecret);
	}
	if (action === "login") {
		return handleLogin(db, body, email, authSecret);
	}
	return { error: "Unknown action" };
}

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	let body: AuthRequestBody;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
	}

	if (body.action === "logout") {
		cookies.delete(AUTH_COOKIE_NAME, { path: "/" });
		return json({ success: true });
	}

	const email = (body.email || "").trim().toLowerCase();
	const password = body.password || "";

	const validationError = validateCredentials(email, password);
	if (validationError) {
		return json({ success: false, error: validationError }, { status: 400 });
	}

	const db = await getDb();
	const result = await executeAuthAction(db, body, email, locals.env.AUTH_SECRET);

	if (result.error || !result.user || !result.token) {
		return json(
			{ success: false, error: result.error || "Authentication failed" },
			{ status: 400 },
		);
	}

	setSessionCookie(cookies, result.token);
	return json({ success: true, user: result.user });
};
