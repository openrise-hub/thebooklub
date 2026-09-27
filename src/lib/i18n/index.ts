import { DEFAULT_LOCALE, type SupportedLocale } from "$lib/constants/i18n";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { localeState } from "./state.svelte";

export type MessageKey = keyof typeof en;

export const catalogs: Record<SupportedLocale, Record<string, string>> = {
	en: en as Record<string, string>,
	es: es as Record<string, string>,
};

export function getLocale(): SupportedLocale {
	return localeState.current;
}

export function setLocale(locale: SupportedLocale): void {
	localeState.set(locale);
}

export function t(
	key: MessageKey,
	params?: Record<string, string | number>,
	locale: SupportedLocale = localeState.current,
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
