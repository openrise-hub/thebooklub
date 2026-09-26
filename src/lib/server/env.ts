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
	R2_ACCOUNT_ID?: string;
	R2_ACCESS_KEY_ID?: string;
	R2_SECRET_ACCESS_KEY?: string;
	R2_BUCKET_NAME?: string;
	R2_ENDPOINT?: string;
	R2_PUBLIC_URL?: string;
	CRON_SECRET?: string;
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
		R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: env.R2_BUCKET_NAME,
		R2_ENDPOINT: env.R2_ENDPOINT,
		R2_PUBLIC_URL: env.R2_PUBLIC_URL,
		CRON_SECRET: env.CRON_SECRET,
	};
}
