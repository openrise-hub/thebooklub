import { env } from "$env/dynamic/private";
import { type Client, createClient } from "@libsql/client";
import { type LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let clientInstance: Client | null = null;
let dbInstance: LibSQLDatabase<typeof schema> | null = null;
let initialized = false;

const INIT_DDL = `
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	user_type INTEGER NOT NULL DEFAULT 2,
	is_email_verified INTEGER NOT NULL DEFAULT 1,
	avatar_url TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS clubs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	cadence TEXT NOT NULL,
	invite_code TEXT NOT NULL UNIQUE,
	advanced_reviews INTEGER NOT NULL DEFAULT 0,
	created_by TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS club_members (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'member',
	current_page INTEGER NOT NULL DEFAULT 0,
	joined_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_cycles (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	book_id TEXT NOT NULL,
	book_title TEXT NOT NULL,
	book_authors TEXT NOT NULL,
	book_description TEXT,
	book_page_count INTEGER NOT NULL,
	book_cover_url TEXT,
	book_info_url TEXT,
	book_buy_url TEXT,
	book_source_provider TEXT,
	start_date INTEGER NOT NULL,
	end_date INTEGER NOT NULL,
	cadence TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	pdf_key TEXT,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS discussions (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	cycle_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	username TEXT NOT NULL,
	avatar_url TEXT NOT NULL,
	content TEXT NOT NULL,
	page_reference INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	cycle_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	username TEXT NOT NULL,
	avatar_url TEXT NOT NULL,
	rating REAL NOT NULL,
	criteria TEXT,
	comment TEXT,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS selection_nominations (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	book_data TEXT NOT NULL,
	color_index INTEGER NOT NULL DEFAULT 0,
	nominated_by TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS selection_polls (
	id TEXT PRIMARY KEY,
	club_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	expires_at INTEGER NOT NULL,
	winner_candidate_id TEXT,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_votes (
	id TEXT PRIMARY KEY,
	poll_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	candidate_id TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
`;

async function initDatabaseSchema(client: Client, dbUrl: string): Promise<void> {
	try {
		await client.execute("PRAGMA foreign_keys = OFF;");
		await client.execute("PRAGMA busy_timeout = 10000;");
		if (dbUrl.startsWith("file:")) {
			try {
				await client.execute("PRAGMA journal_mode = WAL;");
			} catch {
				// Ignore if WAL unsupported in current runtime
			}
		}
		await client.executeMultiple(INIT_DDL);
	} catch {
		// Ignore if tables exist or in test environment
	}
}

export async function getDb(): Promise<LibSQLDatabase<typeof schema>> {
	const isTest = typeof process !== "undefined" && Boolean(process.env.VITEST);
	const dbUrl = env.DATABASE_URL || (isTest ? ":memory:" : "file:local.db");

	if (!clientInstance) {
		const authToken = env.DATABASE_AUTH_TOKEN || undefined;

		clientInstance = createClient({
			url: dbUrl,
			authToken,
		});

		dbInstance = drizzle(clientInstance, { schema });
	}

	if (!initialized) {
		await initDatabaseSchema(clientInstance, dbUrl);
		initialized = true;
	}

	return dbInstance as LibSQLDatabase<typeof schema>;
}

export { schema };
