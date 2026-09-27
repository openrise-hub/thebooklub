import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildClubInviteUrl,
	copyToClipboard,
	downloadQrDataUrl,
	formatQrFilename,
	generateQrPngDataUrl,
	generateQrSvg,
} from "./qrcode";

describe("buildClubInviteUrl", () => {
	it("constructs full invite URL correctly with normalized origin and code", () => {
		expect(buildClubInviteUrl("https://thebookclub.app/", "read-4821")).toBe(
			"https://thebookclub.app/?join=READ-4821",
		);
		expect(buildClubInviteUrl("http://localhost:5173", "JOIN1234")).toBe(
			"http://localhost:5173/?join=JOIN1234",
		);
	});

	it("handles missing or empty origin gracefully", () => {
		expect(buildClubInviteUrl("", "TEST1234")).toBe("/?join=TEST1234");
		expect(buildClubInviteUrl("", "")).toBe("/?join=");
	});
});

describe("formatQrFilename", () => {
	it("formats sanitized filename for club QR code download", () => {
		expect(formatQrFilename("The Sci-Fi Club")).toBe("the-sci-fi-club-invite-qr.png");
		expect(formatQrFilename("  El Club de Lectura!!  ")).toBe("el-club-de-lectura-invite-qr.png");
		expect(formatQrFilename("")).toBe("club-invite-qr.png");
	});
});

describe("generateQrSvg and generateQrPngDataUrl", () => {
	it("generates valid SVG string containing svg elements", async () => {
		const svg = await generateQrSvg("https://thebookclub.app/?join=READ4821");
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");
	});

	it("returns empty string for empty input", async () => {
		expect(await generateQrSvg("")).toBe("");
		expect(await generateQrPngDataUrl("")).toBe("");
	});

	it("generates PNG data URL containing base64 image data", async () => {
		const dataUrl = await generateQrPngDataUrl("https://thebookclub.app/?join=READ4821");
		expect(dataUrl).toContain("data:image/png;base64,");
	});
});

describe("downloadQrDataUrl and copyToClipboard", () => {
	let appendChildMock: ReturnType<typeof vi.fn>;
	let removeChildMock: ReturnType<typeof vi.fn>;
	let clickMock: ReturnType<typeof vi.fn>;
	let writeTextMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clickMock = vi.fn();
		appendChildMock = vi.fn();
		removeChildMock = vi.fn();
		writeTextMock = vi.fn().mockResolvedValue(undefined);

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
		vi.stubGlobal("navigator", {
			clipboard: {
				writeText: writeTextMock,
			},
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("downloads QR data URL by triggering anchor click", () => {
		downloadQrDataUrl("data:image/png;base64,abc", "club-qr.png");
		expect(appendChildMock).toHaveBeenCalled();
		expect(clickMock).toHaveBeenCalled();
		expect(removeChildMock).toHaveBeenCalled();
	});

	it("copies URL to clipboard via navigator.clipboard", async () => {
		const result = await copyToClipboard("https://thebookclub.app/?join=CODE");
		expect(writeTextMock).toHaveBeenCalledWith("https://thebookclub.app/?join=CODE");
		expect(result).toBe(true);
	});
});
