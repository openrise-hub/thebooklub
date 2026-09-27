import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_MAX_AGE_SECONDS,
	LOCALE_COOKIE_NAME,
	type SupportedLocale,
} from "$lib/constants/i18n";

class LocaleState {
	current = $state<SupportedLocale>(DEFAULT_LOCALE);

	set(locale: SupportedLocale): void {
		this.current = locale;
		if (typeof document !== "undefined") {
			document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
			document.documentElement.setAttribute("lang", locale);
		}
	}

	init(locale: SupportedLocale): void {
		this.current = locale;
	}
}

export const localeState = new LocaleState();
