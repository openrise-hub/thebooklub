import {
	DEFAULT_SOCIAL_CARD_FORMAT,
	SOCIAL_CARD_DIMENSIONS,
	SOCIAL_CARD_FORMATS,
	SOCIAL_CARD_MAX_QUOTE_LENGTH,
	SOCIAL_CARD_MIME_TYPE,
	SOCIAL_CARD_PIXEL_RATIO,
} from "$lib/constants/social";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	captureCardAsPng,
	downloadBlob,
	exportSocialCard,
	formatSocialCardFilename,
	sanitizeSlug,
} from "./social";

vi.mock("html-to-image", () => ({
	toBlob: vi.fn().mockImplementation(async (element: unknown) => {
		if (!element) return null;
		return new Blob(["fake-image-content"], { type: "image/png" });
	}),
	toPng: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

describe("Social Constants", () => {
	it("defines supported formats and dimensions", () => {
		expect(SOCIAL_CARD_FORMATS).toEqual(["story", "post"]);
		expect(SOCIAL_CARD_DIMENSIONS.story).toEqual({
			width: 1080,
			height: 1920,
			aspectRatio: "9/16",
		});
		expect(SOCIAL_CARD_DIMENSIONS.post).toEqual({
			width: 1080,
			height: 1080,
			aspectRatio: "1/1",
		});
		expect(SOCIAL_CARD_PIXEL_RATIO).toBe(2);
		expect(SOCIAL_CARD_MAX_QUOTE_LENGTH).toBe(280);
		expect(DEFAULT_SOCIAL_CARD_FORMAT).toBe("post");
		expect(SOCIAL_CARD_MIME_TYPE).toBe("image/png");
	});
});

describe("sanitizeSlug", () => {
	it("normalizes and sanitizes strings for filenames", () => {
		expect(sanitizeSlug("The Book Club")).toBe("the-book-club");
		expect(sanitizeSlug("  El Señor de los Anillos!  ")).toBe("el-se-or-de-los-anillos");
		expect(sanitizeSlug("")).toBe("club");
		expect(sanitizeSlug("---Special---Chars---")).toBe("special-chars");
	});
});

describe("formatSocialCardFilename", () => {
	it("formats file names according to club, book, and format", () => {
		expect(formatSocialCardFilename("Sci-Fi Readers", "Dune", "story")).toBe(
			"sci-fi-readers-dune-story.png",
		);
		expect(formatSocialCardFilename("Classics", "1984", "post")).toBe("classics-1984-post.png");
		expect(formatSocialCardFilename("Club", "Book")).toBe("club-book-post.png");
	});
});

describe("downloadBlob & exportSocialCard", () => {
	let appendChildMock: ReturnType<typeof vi.fn>;
	let removeChildMock: ReturnType<typeof vi.fn>;
	let clickMock: ReturnType<typeof vi.fn>;
	let createObjectURLMock: ReturnType<typeof vi.fn>;
	let revokeObjectURLMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clickMock = vi.fn();
		appendChildMock = vi.fn();
		removeChildMock = vi.fn();
		createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test");
		revokeObjectURLMock = vi.fn();

		const mockElement = {
			click: clickMock,
			href: "",
			download: "",
		};

		const mockDocument = {
			body: {
				appendChild: appendChildMock,
				removeChild: removeChildMock,
			},
			createElement: vi.fn().mockReturnValue(mockElement),
		};

		vi.stubGlobal("window", {});
		vi.stubGlobal("document", mockDocument);
		vi.stubGlobal("URL", {
			createObjectURL: createObjectURLMock,
			revokeObjectURL: revokeObjectURLMock,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("triggers download by creating link and revoking blob URL", () => {
		const blob = new Blob(["test"], { type: "image/png" });
		downloadBlob(blob, "my-card.png");

		expect(createObjectURLMock).toHaveBeenCalledWith(blob);
		expect(appendChildMock).toHaveBeenCalled();
		expect(clickMock).toHaveBeenCalled();
		expect(removeChildMock).toHaveBeenCalled();
		expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test");
	});

	it("captures card as PNG blob", async () => {
		const dummyElement = {} as HTMLElement;
		const blob = await captureCardAsPng(dummyElement);
		expect(blob).toBeInstanceOf(Blob);
	});

	it("exports social card from DOM element to download", async () => {
		const dummyElement = {} as HTMLElement;
		await exportSocialCard(dummyElement, "Awesome Club", "The Hobbit", "story");

		expect(createObjectURLMock).toHaveBeenCalled();
		expect(appendChildMock).toHaveBeenCalled();
		expect(clickMock).toHaveBeenCalled();
		expect(removeChildMock).toHaveBeenCalled();
	});
});
