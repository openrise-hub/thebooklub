// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import("$lib/server/auth").UserSession | null;
			env: import("$lib/server/env").ServerEnv;
			locale: import("$lib/constants/i18n").SupportedLocale;
		}
		interface PageData {
			user?: import("$lib/server/auth").UserSession | null;
			locale?: import("$lib/constants/i18n").SupportedLocale;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
