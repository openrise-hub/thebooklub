import { env } from "$env/dynamic/private";
import {
	type UserSession,
	extractSessionToken,
	isProtectedRoute,
	verifySessionToken,
} from "$lib/server/auth";
import { validateEnv } from "$lib/server/env";
import { type Handle, type RequestEvent, redirect } from "@sveltejs/kit";

function handleAccessGuard(event: RequestEvent, user: UserSession | null): Response | null {
	const pathname = event.url.pathname;
	if (!isProtectedRoute(pathname)) return null;

	if (!user) {
		if (pathname.startsWith("/api/")) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		throw redirect(303, `/?redirect=${encodeURIComponent(pathname)}`);
	}

	if (!user.isEmailVerified) {
		if (pathname.startsWith("/api/")) {
			return new Response(JSON.stringify({ error: "Email verification required" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}
		throw redirect(303, "/?unverified=true");
	}

	return null;
}

export const handle: Handle = async ({ event, resolve }) => {
	const serverEnv = validateEnv(env);

	const token = extractSessionToken(event);
	const user = token ? await verifySessionToken(token, serverEnv.AUTH_SECRET) : null;
	event.locals.user = user;

	const guardResponse = handleAccessGuard(event, user);
	if (guardResponse) {
		return guardResponse;
	}

	return resolve(event);
};
