import { beforeEach, describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { getLocale, setLocale, t } from "./index";

describe("i18n Catalog Parity", () => {
	it("ensures every key in en.json exists in es.json", () => {
		const enKeys = Object.keys(en);
		const esKeys = Object.keys(es);

		expect(enKeys.sort()).toEqual(esKeys.sort());
	});

	it("ensures interpolated variable placeholders match between catalogs", () => {
		const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

		for (const key of Object.keys(en)) {
			if (key.startsWith("$")) continue;
			const enVal = (en as Record<string, string>)[key];
			const esVal = (es as Record<string, string>)[key];

			const enMatches = [...enVal.matchAll(placeholderRegex)].map((m) => m[1]).sort();
			const esMatches = [...esVal.matchAll(placeholderRegex)].map((m) => m[1]).sort();

			expect(enMatches, `Placeholder mismatch on key "${key}"`).toEqual(esMatches);
		}
	});
});

describe("t() Translation Function", () => {
	beforeEach(() => {
		setLocale("en");
	});

	it("resolves English messages correctly by default", () => {
		expect(t("app_name")).toBe("The Book Club");
		expect(t("common_join")).toBe("Join");
		expect(t("wizard_title")).toBe("Create a Reading Club");
		expect(t("nav_dashboard")).toBe("Dashboard");
	});

	it("resolves Spanish messages when locale is set to es", () => {
		setLocale("es");
		expect(t("app_name")).toBe("El Club de Lectura");
		expect(t("common_join")).toBe("Unirse");
		expect(t("wizard_title")).toBe("Crear un Club de Lectura");
		expect(t("nav_dashboard")).toBe("Panel");
	});

	it("interpolates parameters accurately across both languages", () => {
		expect(t("cadence_days_remaining", { count: 5 }, "en")).toBe("5 days remaining");
		expect(t("cadence_days_remaining", { count: 5 }, "es")).toBe("5 días restantes");

		expect(t("wizard_error_name_length", { min: 3, max: 50 }, "en")).toBe(
			"Club name must be between 3 and 50 characters",
		);
		expect(t("wizard_error_name_length", { min: 3, max: 50 }, "es")).toBe(
			"El nombre del club debe tener entre 3 y 50 caracteres",
		);

		expect(t("discussions_spoiler_warning", { page: 120, userPage: 50 }, "en")).toBe(
			"Spoiler: Page 120 (You are on Page 50). Click to reveal.",
		);
		expect(t("discussions_spoiler_warning", { page: 120, userPage: 50 }, "es")).toBe(
			"Spoiler: Página 120 (Estás en la Página 50). Haz clic para revelar.",
		);
	});
});

describe("getLocale and setLocale", () => {
	beforeEach(() => {
		setLocale("en");
	});

	it("updates current locale state", () => {
		expect(getLocale()).toBe("en");
		setLocale("es");
		expect(getLocale()).toBe("es");
	});
});
