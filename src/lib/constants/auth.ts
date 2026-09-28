export const AUTH_COOKIE_NAME = "thebooklub_session";
export const AUTH_HEADER_NAME = "authorization";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const PROTECTED_ROUTE_PREFIXES = ["/club", "/api/club"] as const;
export const PUBLIC_ROUTES = ["/", "/api/books/search", "/api/auth"] as const;

export const PASSWORD_SALT_LENGTH_BYTES = 16;
export const PASSWORD_HASH_ITERATIONS = 100000;

export const USER_TYPE_DEFAULT = 2;
export const USER_TYPE_PDF_UPLOADER = 5;
export const USER_TYPE_ADMIN = 42;
