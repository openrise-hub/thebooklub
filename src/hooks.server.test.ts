import type { RequestEvent, ResolveOptions } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import { handle } from "./hooks.server";
import { LOCALE_COOKIE_NAME } from "./lib/constants/i18n";

vi.mock("$env/dynamic/private", () => ({
	env: {
		AUTH_SECRET: "test-auth-secret-key-32-characters-minimum",
		DATABASE_URL: "libsql://test.turso.io",
		DATABASE_AUTH_TOKEN: "test-token",
		R2_ACCOUNT_ID: "test-account",
		R2_ACCESS_KEY_ID: "test-key",
		R2_SECRET_ACCESS_KEY: "test-secret",
		R2_BUCKET_NAME: "test-bucket",
	},
}));

function createMockEvent(options: {
	pathname?: string;
	cookieLocale?: string;
	acceptLanguage?: string;
}): RequestEvent {
	const pathname = options.pathname ?? "/";
	const cookiesMap = new Map<string, string>();
	if (options.cookieLocale) {
		cookiesMap.set(LOCALE_COOKIE_NAME, options.cookieLocale);
	}

	const headers = new Headers();
	if (options.acceptLanguage) {
		headers.set("accept-language", options.acceptLanguage);
	}

	const request = new Request(`http://localhost${pathname}`, { headers });

	return {
		request,
		url: new URL(`http://localhost${pathname}`),
		cookies: {
			get: (name: string) => cookiesMap.get(name),
		},
		locals: {},
	} as unknown as RequestEvent;
}

describe("hooks.server handle pipeline", () => {
	it("detects locale from cookie and attaches to event.locals", async () => {
		const event = createMockEvent({ cookieLocale: "es" });
		let transformedHtml = "";

		const mockResolve = vi.fn(async (_event: RequestEvent, opts?: ResolveOptions) => {
			if (opts?.transformPageChunk) {
				const result = await opts.transformPageChunk({
					html: '<!doctype html><html lang="%lang%"><head></head></html>',
					done: true,
				});
				transformedHtml = result ?? "";
			}
			return new Response("OK");
		});

		await handle({ event, resolve: mockResolve });

		expect(event.locals.locale).toBe("es");
		expect(transformedHtml).toBe('<!doctype html><html lang="es"><head></head></html>');
	});

	it("detects locale from Accept-Language header when cookie is absent", async () => {
		const event = createMockEvent({ acceptLanguage: "es-MX,es;q=0.9,en;q=0.8" });
		let transformedHtml = "";

		const mockResolve = vi.fn(async (_event: RequestEvent, opts?: ResolveOptions) => {
			if (opts?.transformPageChunk) {
				const result = await opts.transformPageChunk({
					html: '<!doctype html><html lang="%lang%"><head></head></html>',
					done: true,
				});
				transformedHtml = result ?? "";
			}
			return new Response("OK");
		});

		await handle({ event, resolve: mockResolve });

		expect(event.locals.locale).toBe("es");
		expect(transformedHtml).toBe('<!doctype html><html lang="es"><head></head></html>');
	});

	it("falls back to default locale en when no cookie or header is present", async () => {
		const event = createMockEvent({});
		let transformedHtml = "";

		const mockResolve = vi.fn(async (_event: RequestEvent, opts?: ResolveOptions) => {
			if (opts?.transformPageChunk) {
				const result = await opts.transformPageChunk({
					html: '<!doctype html><html lang="%lang%"><head></head></html>',
					done: true,
				});
				transformedHtml = result ?? "";
			}
			return new Response("OK");
		});

		await handle({ event, resolve: mockResolve });

		expect(event.locals.locale).toBe("en");
		expect(transformedHtml).toBe('<!doctype html><html lang="en"><head></head></html>');
	});
});
