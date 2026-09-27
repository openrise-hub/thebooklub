import {
	QR_CODE_COLORS,
	QR_CODE_DEFAULT_MARGIN,
	QR_CODE_DEFAULT_WIDTH,
	QR_CODE_ERROR_CORRECTION_LEVEL,
	QR_CODE_HIGH_RES_WIDTH,
} from "$lib/constants/qr";
import QRCode from "qrcode";

export function buildClubInviteUrl(origin: string, inviteCode: string): string {
	const cleanOrigin = (origin || "").trim().replace(/\/+$/, "");
	const cleanCode = (inviteCode || "").trim().toUpperCase();
	if (!cleanOrigin && !cleanCode) return "/?join=";
	if (!cleanOrigin) return `/?join=${encodeURIComponent(cleanCode)}`;
	return `${cleanOrigin}/?join=${encodeURIComponent(cleanCode)}`;
}

export function formatQrFilename(clubName: string): string {
	const clean =
		(clubName || "club")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "club";
	return `${clean}-invite-qr.png`;
}

export async function generateQrSvg(
	text: string,
	options: { margin?: number; width?: number } = {},
): Promise<string> {
	if (!text) return "";

	return QRCode.toString(text, {
		type: "svg",
		margin: options.margin ?? QR_CODE_DEFAULT_MARGIN,
		width: options.width ?? QR_CODE_DEFAULT_WIDTH,
		errorCorrectionLevel: QR_CODE_ERROR_CORRECTION_LEVEL,
		color: {
			dark: QR_CODE_COLORS.dark,
			light: QR_CODE_COLORS.light,
		},
	});
}

export async function generateQrPngDataUrl(
	text: string,
	options: { width?: number; margin?: number } = {},
): Promise<string> {
	if (!text) return "";

	return QRCode.toDataURL(text, {
		width: options.width ?? QR_CODE_HIGH_RES_WIDTH,
		margin: options.margin ?? QR_CODE_DEFAULT_MARGIN,
		errorCorrectionLevel: QR_CODE_ERROR_CORRECTION_LEVEL,
		color: {
			dark: QR_CODE_COLORS.dark,
			light: QR_CODE_COLORS.light,
		},
	});
}

export function downloadQrDataUrl(dataUrl: string, filename: string): void {
	if (typeof window === "undefined" || typeof document === "undefined" || !dataUrl) return;

	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export async function copyToClipboard(text: string): Promise<boolean> {
	if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
		return false;
	}

	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
