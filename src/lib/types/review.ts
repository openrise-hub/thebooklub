import type { AdvancedCriteriaKey } from "$lib/constants/ratings";

export interface ReviewCriteriaScores {
	plot: number;
	characters: number;
	pacing: number;
	writing: number;
	emotion: number;
}

export interface Review {
	id: string;
	clubId: string;
	cycleId: string;
	userId: string;
	username: string;
	avatarUrl: string;
	rating: number;
	comment?: string;
	criteria?: ReviewCriteriaScores;
	createdAt: number;
	updatedAt: number;
}

export interface ReviewPostRequest {
	cycleId: string;
	rating: number;
	comment?: string;
	criteria?: ReviewCriteriaScores;
}

export interface ReviewPostResponse {
	success: boolean;
	review?: Review;
	error?: string;
}

export interface ReviewListResponse {
	success: boolean;
	clubId: string;
	cycleId: string;
	averageRating: number;
	criteriaAverages?: Record<AdvancedCriteriaKey, number>;
	totalReviews: number;
	reviews: Review[];
	error?: string;
}
