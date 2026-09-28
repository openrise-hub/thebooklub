import { getDb } from "$lib/server/db/index";
import { readingCycles } from "$lib/server/db/schema";
import { validateEnv } from "$lib/server/env";
import { runPurgeProtocol } from "$lib/server/purge";
import type { ReadingCycle } from "$lib/types/cycle";
import { type RequestHandler, json } from "@sveltejs/kit";
import { eq, isNotNull } from "drizzle-orm";

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
		if (body && Array.isArray(body.cycles) && body.cycles.length > 0) {
			targetCycles = body.cycles;
		}
	} catch {
		targetCycles = [];
	}

	const db = await getDb();

	if (targetCycles.length === 0) {
		const dbCycles = await db.select().from(readingCycles).where(isNotNull(readingCycles.pdfKey));

		targetCycles = dbCycles.map((c) => ({
			id: c.id,
			clubId: c.clubId,
			book: {
				id: c.bookId,
				title: c.bookTitle,
				authors: JSON.parse(c.bookAuthors),
				description: c.bookDescription ?? undefined,
				pageCount: c.bookPageCount,
				requiresManualPages: false,
				coverUrl: c.bookCoverUrl ?? null,
				infoUrl: c.bookInfoUrl ?? undefined,
				buyUrl: c.bookBuyUrl ?? undefined,
				sourceProvider: (c.bookSourceProvider as "google_books" | "open_library") ?? "google_books",
			},
			startDate: c.startDate,
			endDate: c.endDate,
			cadence: c.cadence as "weekly" | "monthly" | "custom",
			status: c.status as "active" | "completed" | "purged",
			pdfKey: c.pdfKey,
		}));
	}

	const report = await runPurgeProtocol(env, targetCycles);

	// Update DB records for purged cycles
	for (const res of report.results) {
		if (res.action === "purged") {
			await db
				.update(readingCycles)
				.set({ status: "purged", pdfKey: null })
				.where(eq(readingCycles.id, res.cycleId));
		}
	}

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

	const db = await getDb();
	const dbCycles = await db.select().from(readingCycles).where(isNotNull(readingCycles.pdfKey));

	const targetCycles: ReadingCycle[] = dbCycles.map((c) => ({
		id: c.id,
		clubId: c.clubId,
		book: {
			id: c.bookId,
			title: c.bookTitle,
			authors: JSON.parse(c.bookAuthors),
			description: c.bookDescription ?? undefined,
			pageCount: c.bookPageCount,
			requiresManualPages: false,
			coverUrl: c.bookCoverUrl ?? null,
			infoUrl: c.bookInfoUrl ?? undefined,
			buyUrl: c.bookBuyUrl ?? undefined,
			sourceProvider: (c.bookSourceProvider as "google_books" | "open_library") ?? "google_books",
		},
		startDate: c.startDate,
		endDate: c.endDate,
		cadence: c.cadence as "weekly" | "monthly" | "custom",
		status: c.status as "active" | "completed" | "purged",
		pdfKey: c.pdfKey,
	}));

	const report = await runPurgeProtocol(env, targetCycles);

	for (const res of report.results) {
		if (res.action === "purged") {
			await db
				.update(readingCycles)
				.set({ status: "purged", pdfKey: null })
				.where(eq(readingCycles.id, res.cycleId));
		}
	}

	return json({
		success: true,
		...report,
	});
};
