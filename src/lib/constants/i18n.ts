export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "app_locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 31536000;

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
	en: "English",
	es: "Español",
};
