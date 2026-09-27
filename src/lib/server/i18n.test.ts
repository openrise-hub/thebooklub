import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "../constants/i18n";
import {
	isSupportedLocale,
	parseAcceptLanguage,
	resolveLocale,
	resolveLocaleFromRequest,
	transformHtmlLang,
} from "./i18n";

describe("i18n server utilities", () => {
	describe("isSupportedLocale", () => {
		it("identifies supported locales accurately", () => {
			for (const locale of SUPPORTED_LOCALES) {
				expect(isSupportedLocale(locale)).toBe(true);
			}
			expect(isSupportedLocale("fr")).toBe(false);
			expect(isSupportedLocale("de")).toBe(false);
			expect(isSupportedLocale("")).toBe(false);
			expect(isSupportedLocale("en-US")).toBe(false);
		});
	});

	describe("parseAcceptLanguage", () => {
		it("returns empty array for empty, null, or undefined headers", () => {
			expect(parseAcceptLanguage(null)).toEqual([]);
			expect(parseAcceptLanguage(undefined)).toEqual([]);
			expect(parseAcceptLanguage("")).toEqual([]);
			expect(parseAcceptLanguage("   ")).toEqual([]);
		});

		it("ignores wildcard language tag", () => {
			expect(parseAcceptLanguage("*")).toEqual([]);
			expect(parseAcceptLanguage("*, en;q=0.5")).toEqual(["en"]);
		});

		it("extracts and lowercases primary language subtags", () => {
			expect(parseAcceptLanguage("en-US")).toEqual(["en"]);
			expect(parseAcceptLanguage("ES-VE")).toEqual(["es"]);
			expect(parseAcceptLanguage("es-419")).toEqual(["es"]);
		});

		it("sorts language tags in descending order of quality factor", () => {
			const header = "en;q=0.3, es;q=0.9, fr;q=0.7";
			expect(parseAcceptLanguage(header)).toEqual(["es", "fr", "en"]);
		});

		it("deduplicates language tags while preserving highest quality order", () => {
			const header = "es-VE, es-MX;q=0.9, es;q=0.8, en-US;q=0.5";
			expect(parseAcceptLanguage(header)).toEqual(["es", "en"]);
		});

		it("handles malformed entries gracefully", () => {
			const header = ",,, ;q=0.9, invalid;q=notanumber, es;q=0.8";
			expect(parseAcceptLanguage(header)).toEqual(["invalid", "es"]);
		});
	});

	describe("resolveLocale", () => {
		it("uses valid cookie locale when present", () => {
			expect(resolveLocale("es", "en-US,en;q=0.9")).toBe("es");
			expect(resolveLocale("en", "es-VE,es;q=0.9")).toBe("en");
		});

		it("falls through to accept-language header when cookie is invalid", () => {
			expect(resolveLocale("invalid-locale", "es-VE,es;q=0.9")).toBe("es");
			expect(resolveLocale("", "es-MX")).toBe("es");
			expect(resolveLocale(null, "es-CL")).toBe("es");
			expect(resolveLocale(undefined, "es-ES")).toBe("es");
		});

		it("resolves primary language from compound accept-language header", () => {
			expect(resolveLocale(null, "es-VE,es;q=0.9,en;q=0.8")).toBe("es");
			expect(resolveLocale(null, "fr-FR,en-GB;q=0.9,es;q=0.8")).toBe("en");
		});

		it("falls back to DEFAULT_LOCALE when header contains unsupported languages", () => {
			expect(resolveLocale(null, "de-DE,fr;q=0.9")).toBe(DEFAULT_LOCALE);
			expect(resolveLocale(null, null)).toBe(DEFAULT_LOCALE);
			expect(resolveLocale(undefined, undefined)).toBe(DEFAULT_LOCALE);
		});
	});

	describe("resolveLocaleFromRequest", () => {
		it("reads locale from request cookies", () => {
			const mockEvent = {
				cookies: {
					get: (name: string) => (name === LOCALE_COOKIE_NAME ? "es" : undefined),
				},
				request: {
					headers: {
						get: () => "en-US",
					},
				},
			} as unknown as Parameters<typeof resolveLocaleFromRequest>[0];

			expect(resolveLocaleFromRequest(mockEvent)).toBe("es");
		});

		it("reads locale from accept-language header when cookie is missing", () => {
			const mockEvent = {
				cookies: {
					get: () => undefined,
				},
				request: {
					headers: {
						get: (name: string) => (name === "accept-language" ? "es-AR,es;q=0.9" : null),
					},
				},
			} as unknown as Parameters<typeof resolveLocaleFromRequest>[0];

			expect(resolveLocaleFromRequest(mockEvent)).toBe("es");
		});

		it("falls back to default locale when neither cookie nor header match", () => {
			const mockEvent = {
				cookies: {
					get: () => undefined,
				},
				request: {
					headers: {
						get: () => null,
					},
				},
			} as unknown as Parameters<typeof resolveLocaleFromRequest>[0];

			expect(resolveLocaleFromRequest(mockEvent)).toBe(DEFAULT_LOCALE);
		});
	});

	describe("transformHtmlLang", () => {
		it("replaces %lang% placeholder with target locale", () => {
			const input = '<!doctype html><html lang="%lang%"><head></head></html>';
			expect(transformHtmlLang(input, "es")).toBe(
				'<!doctype html><html lang="es"><head></head></html>',
			);
		});

		it("replaces existing lang attribute when %lang% is absent", () => {
			const input = '<!doctype html><html lang="en"><head></head></html>';
			expect(transformHtmlLang(input, "es")).toBe(
				'<!doctype html><html lang="es"><head></head></html>',
			);
		});

		it("preserves other html tag attributes when updating lang", () => {
			const input = '<!doctype html><html class="dark-theme" lang="en"><head></head></html>';
			expect(transformHtmlLang(input, "es")).toBe(
				'<!doctype html><html class="dark-theme" lang="es"><head></head></html>',
			);
		});

		it("injects lang attribute if html tag has none", () => {
			const input = "<!doctype html><html><head></head></html>";
			expect(transformHtmlLang(input, "es")).toBe(
				'<!doctype html><html lang="es"><head></head></html>',
			);
		});
	});
});
