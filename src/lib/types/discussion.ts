export interface DiscussionMessage {
	id: string;
	clubId: string;
	cycleId: string;
	userId: string;
	username: string;
	avatarUrl: string;
	content: string;
	pageReference: number;
	createdAt: number;
}

export interface DiscussionPostRequest {
	content: string;
	pageReference: number;
	cycleId: string;
}

export interface DiscussionPostResponse {
	success: boolean;
	message?: DiscussionMessage;
	error?: string;
}

export interface DiscussionListResponse {
	success: boolean;
	messages: DiscussionMessage[];
	error?: string;
}
