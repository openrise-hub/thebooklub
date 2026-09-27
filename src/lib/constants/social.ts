export type SocialCardFormat = "story" | "post";

export interface SocialCardDimension {
	width: number;
	height: number;
	aspectRatio: string;
}

export const SOCIAL_CARD_FORMATS: readonly SocialCardFormat[] = ["story", "post"] as const;

export const SOCIAL_CARD_DIMENSIONS: Record<SocialCardFormat, SocialCardDimension> = {
	story: {
		width: 1080,
		height: 1920,
		aspectRatio: "9/16",
	},
	post: {
		width: 1080,
		height: 1080,
		aspectRatio: "1/1",
	},
};

export const SOCIAL_CARD_PIXEL_RATIO = 2;
export const SOCIAL_CARD_MAX_QUOTE_LENGTH = 280;
export const DEFAULT_SOCIAL_CARD_FORMAT: SocialCardFormat = "post";
export const SOCIAL_CARD_MIME_TYPE = "image/png";
