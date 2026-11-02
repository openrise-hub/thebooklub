import { USER_TYPE_DEFAULT } from "$lib/constants/auth";
import type { UserSession } from "$lib/server/auth";
import { getDb } from "$lib/server/db/index";
import { users } from "$lib/server/db/schema";
import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import type { ServerEnv } from "./env";

let clerkClientInstance: ReturnType<typeof createClerkClient> | null = null;

export function getClerk(env: ServerEnv): ReturnType<typeof createClerkClient> | null {
	if (!clerkClientInstance && env.CLERK_SECRET_KEY) {
		clerkClientInstance = createClerkClient({
			secretKey: env.CLERK_SECRET_KEY,
			publishableKey: env.CLERK_PUBLISHABLE_KEY,
		});
	}
	return clerkClientInstance;
}

async function registerNewClerkUser(
	db: Awaited<ReturnType<typeof getDb>>,
	clerk: ReturnType<typeof createClerkClient>,
	userId: string,
): Promise<UserSession> {
	const clerkUser = await clerk.users.getUser(userId);
	const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clerk.local`;
	const username =
		clerkUser.username ||
		clerkUser.firstName ||
		email.split("@")[0] ||
		`reader_${userId.slice(-6)}`;
	const avatarUrl = clerkUser.imageUrl || `https://gravatar.com/avatar/${userId}?d=retro`;
	const userType = (clerkUser.publicMetadata?.userType as number) || USER_TYPE_DEFAULT;
	const now = Math.floor(Date.now() / 1000);

	await db.insert(users).values({
		id: userId,
		email,
		username,
		passwordHash: "clerk_managed",
		userType,
		isEmailVerified: true,
		avatarUrl,
		createdAt: now,
	});

	return {
		id: userId,
		email,
		username,
		userType,
		isEmailVerified: true,
		avatarUrl,
		createdAt: now,
	};
}

export async function resolveClerkUser(
	request: Request,
	env: ServerEnv,
): Promise<UserSession | null> {
	if (env.AUTH_PROVIDER !== "clerk" || !env.CLERK_SECRET_KEY) {
		return null;
	}

	const clerk = getClerk(env);
	if (!clerk) return null;

	try {
		const requestState = await clerk.authenticateRequest(request);
		if (!requestState.isSignedIn) {
			return null;
		}

		const auth = requestState.toAuth();
		if (!auth.userId) return null;

		const db = await getDb();
		const existing = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);

		if (existing.length > 0) {
			const u = existing[0];
			return {
				id: u.id,
				email: u.email,
				username: u.username,
				userType: u.userType,
				isEmailVerified: Boolean(u.isEmailVerified),
				avatarUrl: u.avatarUrl,
				createdAt: u.createdAt,
			};
		}

		return await registerNewClerkUser(db, clerk, auth.userId);
	} catch {
		return null;
	}
}
