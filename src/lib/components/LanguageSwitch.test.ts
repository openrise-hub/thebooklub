import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "$lib/constants/i18n";
import { getLocale, setLocale, t } from "$lib/i18n";
import { localeState } from "$lib/i18n/state.svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("LanguageSwitch & Reactive Locale State", () => {
	beforeEach(() => {
		setLocale(DEFAULT_LOCALE);
	});

	it("defaults to standard default locale", () => {
		expect(getLocale()).toBe("en");
		expect(localeState.current).toBe("en");
	});

	it("updates locale state and document attributes upon setLocale", () => {
		const mockDocument = {
			cookie: "",
			documentElement: {
				setAttribute: vi.fn(),
			},
		};
		vi.stubGlobal("document", mockDocument);

		setLocale("es");
		expect(getLocale()).toBe("es");
		expect(localeState.current).toBe("es");
		expect(mockDocument.cookie).toContain(`${LOCALE_COOKIE_NAME}=es`);
		expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith("lang", "es");

		vi.unstubAllGlobals();
	});

	it("switches translation outputs reactively without full page reload", () => {
		setLocale("en");
		expect(t("nav_dashboard")).toBe("Dashboard");
		expect(t("cadence_weekly")).toBe("Weekly");
		expect(t("ratings_plot")).toBe("Plot & Structure");

		setLocale("es");
		expect(t("nav_dashboard")).toBe("Panel");
		expect(t("cadence_weekly")).toBe("Semanal");
		expect(t("ratings_plot")).toBe("Trama y Estructura");
	});

	it("supports initializing locale during SSR / layout hydration", () => {
		localeState.init("es");
		expect(localeState.current).toBe("es");
		expect(getLocale()).toBe("es");
	});

	it("verifies all supported locales can be activated", () => {
		for (const loc of SUPPORTED_LOCALES) {
			setLocale(loc);
			expect(getLocale()).toBe(loc);
		}
	});
});
