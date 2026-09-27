import { type RequestHandler, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ error: "Authentication required to vote in book selection poll" },
			{ status: 401 },
		);
	}

	let body: {
		candidateId?: string;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	const candidateId = body.candidateId;
	if (!candidateId || typeof candidateId !== "string") {
		return json({ error: "Missing candidate ID" }, { status: 400 });
	}

	return json({
		success: true,
		clubId,
		votedCandidateId: candidateId,
		timestamp: new Date().toISOString(),
	});
};
