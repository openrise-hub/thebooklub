import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it } from "vitest";
import { POST } from "./+server";

function createMockVoteEvent(options: {
	clubId?: string;
	body?: Record<string, unknown>;
}): RequestEvent {
	const { clubId, body } = options;
	return {
		params: clubId !== undefined ? { id: clubId } : {},
		request: {
			json: async () => body ?? {},
		},
	} as unknown as RequestEvent;
}

describe("POST /api/club/[id]/selection/poll/vote", () => {
	it("records user vote successfully", async () => {
		const event = createMockVoteEvent({
			clubId: "club-123",
			body: { candidateId: "cand-456" },
		});

		const res = await POST(event);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.votedCandidateId).toBe("cand-456");
	});

	it("rejects missing candidate ID", async () => {
		const event = createMockVoteEvent({
			clubId: "club-123",
			body: {},
		});

		const res = await POST(event);
		expect(res.status).toBe(400);
	});

	it("rejects missing club ID", async () => {
		const event = createMockVoteEvent({
			body: { candidateId: "cand-1" },
		});

		const res = await POST(event);
		expect(res.status).toBe(400);
	});
});
