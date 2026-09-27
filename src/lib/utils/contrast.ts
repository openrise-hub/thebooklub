/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio calculations.
 * Reference: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace("#", "").trim();
	if (cleanHex.length === 3) {
		return {
			r: Number.parseInt(cleanHex[0] + cleanHex[0], 16),
			g: Number.parseInt(cleanHex[1] + cleanHex[1], 16),
			b: Number.parseInt(cleanHex[2] + cleanHex[2], 16),
		};
	}
	if (cleanHex.length === 6) {
		return {
			r: Number.parseInt(cleanHex.substring(0, 2), 16),
			g: Number.parseInt(cleanHex.substring(2, 4), 16),
			b: Number.parseInt(cleanHex.substring(4, 6), 16),
		};
	}
	throw new Error(`Invalid hex color: ${hex}`);
}

export function getRelativeLuminance(hex: string): number {
	const { r, g, b } = parseHexColor(hex);

	const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
		return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
	});

	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
	const lum1 = getRelativeLuminance(hex1);
	const lum2 = getRelativeLuminance(hex2);

	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);

	const ratio = (brightest + 0.05) / (darkest + 0.05);
	return Number(ratio.toFixed(2));
}
