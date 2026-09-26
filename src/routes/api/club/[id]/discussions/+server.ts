import { validateDiscussionMessage } from "$lib/club/discussion";
import type { DiscussionMessage, DiscussionPostRequest } from "$lib/types/discussion";
import { type RequestHandler, json } from "@sveltejs/kit";

const mockDiscussionsStore: Record<string, DiscussionMessage[]> = {
	"READ-4821": [
		{
			id: "msg-1",
			clubId: "READ-4821",
			cycleId: "cycle-1",
			userId: "user-alice",
			username: "AliceReader",
			avatarUrl: "https://gravatar.com/avatar/alice?d=identicon",
			content: "The opening worldbuilding completely hooked me! The sprawl is incredible.",
			pageReference: 15,
			createdAt: Date.now() - 3600000 * 5,
		},
		{
			id: "msg-2",
			clubId: "READ-4821",
			cycleId: "cycle-1",
			userId: "user-bob",
			username: "BobBooks",
			avatarUrl: "https://gravatar.com/avatar/bob?d=identicon",
			content: "Case's motivation becomes much clearer around this milestone. What a ride.",
			pageReference: 85,
			createdAt: Date.now() - 3600000 * 2,
		},
	],
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to view club discussions" },
			{ status: 401 },
		);
	}

	const messages = mockDiscussionsStore[clubId] ?? [];

	return json({
		success: true,
		clubId,
		messages: [...messages].sort((a, b) => a.createdAt - b.createdAt),
	});
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	const clubId = params.id;

	if (!clubId) {
		return json({ success: false, error: "Club ID is required" }, { status: 400 });
	}

	if (!user) {
		return json(
			{ success: false, error: "Authentication required to post messages" },
			{ status: 401 },
		);
	}

	let body: DiscussionPostRequest;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: "Invalid JSON request body" }, { status: 400 });
	}

	const validation = validateDiscussionMessage(body.content, body.pageReference, 10000);
	if (!validation.valid) {
		return json({ success: false, error: validation.error }, { status: 400 });
	}

	const newMessage: DiscussionMessage = {
		id: `msg-${crypto.randomUUID().slice(0, 8)}`,
		clubId,
		cycleId: body.cycleId || "cycle-active",
		userId: user.id,
		username: user.username,
		avatarUrl: user.avatarUrl,
		content: body.content.trim(),
		pageReference: Math.floor(body.pageReference),
		createdAt: Date.now(),
	};

	if (!mockDiscussionsStore[clubId]) {
		mockDiscussionsStore[clubId] = [];
	}
	mockDiscussionsStore[clubId].push(newMessage);

	return json({
		success: true,
		message: newMessage,
	});
};
