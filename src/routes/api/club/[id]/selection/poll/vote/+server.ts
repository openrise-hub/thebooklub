import { type RequestHandler, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ params, request }) => {
	const clubId = params.id;
	if (!clubId) {
		return json({ error: "Missing club ID" }, { status: 400 });
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
