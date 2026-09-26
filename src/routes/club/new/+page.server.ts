import { ROUTES } from "$lib/constants/routes";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, `/?redirect=${encodeURIComponent(ROUTES.CLUB_NEW)}`);
	}

	return {
		user: locals.user,
	};
};
