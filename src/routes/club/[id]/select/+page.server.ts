import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const clubId = params.id;
	if (!clubId) {
		throw error(404, "Club not found");
	}

	return {
		clubId,
		club: {
			id: clubId,
			name: "The Book Club",
			inviteCode: "READ4821",
			isAdmin: true,
		},
		candidates: [],
	};
};
