import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	const authProvider = locals.env?.AUTH_PROVIDER || "local";
	const clerkPublishableKey = locals.env?.CLERK_PUBLISHABLE_KEY || "";

	return {
		locale: locals.locale,
		user: locals.user,
		authProvider,
		clerkPublishableKey,
	};
};
