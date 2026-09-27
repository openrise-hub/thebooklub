import { buildClubInviteUrl, formatQrFilename } from "$lib/utils/qrcode";
import { describe, expect, it } from "vitest";

describe("QRCodeModal URL and Filename Logic", () => {
	it("formats invite URL from origin and invite code", () => {
		const url = buildClubInviteUrl("https://thebookclub.app", "READ4821");
		expect(url).toBe("https://thebookclub.app/?join=READ4821");
	});

	it("formats PNG download filename from club name", () => {
		const filename = formatQrFilename("Classics & Coffee");
		expect(filename).toBe("classics-coffee-invite-qr.png");
	});

	it("handles special characters in invite code cleanly", () => {
		const url = buildClubInviteUrl("https://example.com", "BOOK-1234");
		expect(url).toBe("https://example.com/?join=BOOK-1234");
	});
});
