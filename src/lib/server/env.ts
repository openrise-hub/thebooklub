export interface ServerEnv {
	AUTH_SECRET: string;
	AUTH_PROVIDER?: "clerk" | "kinde" | "local";
	CLERK_SECRET_KEY?: string;
	CLERK_PUBLISHABLE_KEY?: string;
	KINDE_CLIENT_ID?: string;
	KINDE_CLIENT_SECRET?: string;
	KINDE_ISSUER_URL?: string;
	KINDE_SITE_URL?: string;
	DATABASE_URL?: string;
	DATABASE_AUTH_TOKEN?: string;
}

export function validateEnv(env: Record<string, string | undefined>): ServerEnv {
	const authSecret = env.AUTH_SECRET || "dev-auth-secret-min-32-chars-bookclub-session";
	const authProvider = (env.AUTH_PROVIDER as ServerEnv["AUTH_PROVIDER"]) || "local";

	return {
		AUTH_SECRET: authSecret,
		AUTH_PROVIDER: authProvider,
		CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
		CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY,
		KINDE_CLIENT_ID: env.KINDE_CLIENT_ID,
		KINDE_CLIENT_SECRET: env.KINDE_CLIENT_SECRET,
		KINDE_ISSUER_URL: env.KINDE_ISSUER_URL,
		KINDE_SITE_URL: env.KINDE_SITE_URL,
		DATABASE_URL: env.DATABASE_URL,
		DATABASE_AUTH_TOKEN: env.DATABASE_AUTH_TOKEN,
	};
}
