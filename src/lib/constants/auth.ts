/**
 * Centralized authentication constants and cookie settings.
 */

export const AUTH_COOKIE_NAME = "thebooklub_session";
export const AUTH_HEADER_NAME = "authorization";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const PROTECTED_ROUTE_PREFIXES = ["/club", "/api/club"] as const;
export const PUBLIC_ROUTES = ["/", "/api/books/search"] as const;
