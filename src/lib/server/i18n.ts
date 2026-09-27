import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "$lib/constants/i18n";
import type { RequestEvent } from "@sveltejs/kit";

interface LanguagePreference {
	tag: string;
	quality: number;
}

function parseQualityFactor(rawQuality: string | undefined): number {
	if (!rawQuality) return 1;
	const match = rawQuality.match(/q=\s*([0-9.]+)/i);
	if (!match?.[1]) return 1;
	const parsed = Number.parseFloat(match[1]);
	return Number.isNaN(parsed) ? 1 : parsed;
}

function parsePreferenceEntry(entry: string): LanguagePreference | null {
	const trimmed = entry.trim();
	if (!trimmed) return null;

	const [rawTag, rawQuality] = trimmed.split(";");
	const tag = rawTag?.trim().toLowerCase();
	if (!tag || tag === "*") return null;

	return {
		tag,
		quality: parseQualityFactor(rawQuality),
	};
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function parseAcceptLanguage(header: string | null | undefined): string[] {
	if (!header?.trim()) {
		return [];
	}

	const preferences = header
		.split(",")
		.map(parsePreferenceEntry)
		.filter((pref): pref is LanguagePreference => pref !== null)
		.sort((a, b) => b.quality - a.quality);

	const resolvedTags: string[] = [];
	for (const { tag } of preferences) {
		const primaryTag = tag.split("-")[0];
		if (primaryTag && !resolvedTags.includes(primaryTag)) {
			resolvedTags.push(primaryTag);
		}
	}

	return resolvedTags;
}

export function resolveLocale(
	cookieLocale: string | null | undefined,
	acceptLanguageHeader: string | null | undefined,
): SupportedLocale {
	if (cookieLocale && isSupportedLocale(cookieLocale)) {
		return cookieLocale;
	}

	const candidateLanguages = parseAcceptLanguage(acceptLanguageHeader);
	for (const candidate of candidateLanguages) {
		if (isSupportedLocale(candidate)) {
			return candidate;
		}
	}

	return DEFAULT_LOCALE;
}

export function resolveLocaleFromRequest(event: RequestEvent): SupportedLocale {
	const cookieLocale = event.cookies.get(LOCALE_COOKIE_NAME);
	const acceptLanguage = event.request.headers.get("accept-language");
	return resolveLocale(cookieLocale, acceptLanguage);
}

export function transformHtmlLang(html: string, locale: SupportedLocale): string {
	if (html.includes("%lang%")) {
		return html.replace(/%lang%/g, locale);
	}
	if (/<html[^>]*lang=/i.test(html)) {
		return html.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${locale}"`);
	}
	return html.replace(/<html/i, `<html lang="${locale}"`);
}
