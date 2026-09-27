import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type SupportedLocale } from "$lib/constants/i18n";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";

export type MessageKey = keyof typeof en;

export const catalogs: Record<SupportedLocale, Record<string, string>> = {
	en: en as Record<string, string>,
	es: es as Record<string, string>,
};

let currentLocale: SupportedLocale = DEFAULT_LOCALE;

export function getLocale(): SupportedLocale {
	return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
	currentLocale = locale;
	if (typeof document !== "undefined") {
		document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
	}
}

export function t(
	key: MessageKey,
	params?: Record<string, string | number>,
	locale: SupportedLocale = currentLocale,
): string {
	const catalog = catalogs[locale] || catalogs[DEFAULT_LOCALE];
	let message = catalog[key] || catalogs[DEFAULT_LOCALE][key] || key;

	if (params) {
		for (const [paramKey, paramValue] of Object.entries(params)) {
			message = message.replaceAll(`{${paramKey}}`, String(paramValue));
		}
	}

	return message;
}
