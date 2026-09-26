import { validateEnv } from "$lib/server/env";
import { runPurgeProtocol } from "$lib/server/purge";
import type { ReadingCycle } from "$lib/types/cycle";
import { type RequestHandler, json } from "@sveltejs/kit";

function isAuthorizedCron(request: Request, cronSecret?: string): boolean {
	if (!cronSecret) {
		return true;
	}

	const authHeader = request.headers.get("authorization");
	const customHeader = request.headers.get("x-cron-secret");

	if (customHeader && customHeader === cronSecret) {
		return true;
	}

	if (authHeader) {
		const parts = authHeader.split(" ");
		if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && parts[1] === cronSecret) {
			return true;
		}
	}

	return false;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const env = locals.env ?? validateEnv({});

	if (!isAuthorizedCron(request, env.CRON_SECRET)) {
		return json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
	}

	let targetCycles: ReadingCycle[] = [];
	try {
		const body = await request.json();
		if (body && Array.isArray(body.cycles)) {
			targetCycles = body.cycles;
		}
	} catch {
		targetCycles = [];
	}

	const report = await runPurgeProtocol(env, targetCycles);

	return json({
		success: true,
		...report,
	});
};

export const GET: RequestHandler = async ({ request, locals }) => {
	const env = locals.env ?? validateEnv({});

	if (!isAuthorizedCron(request, env.CRON_SECRET)) {
		return json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
	}

	const report = await runPurgeProtocol(env, []);

	return json({
		success: true,
		...report,
	});
};
