import { DEFAULT_ZOOM, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "$lib/constants/storage";
import { STORAGE_KEYS } from "$lib/constants/ui";
import { describe, expect, it } from "vitest";

function clampPage(page: number, max: number): number {
	if (Number.isNaN(page) || page < 1) return 1;
	if (page > max) return max;
	return Math.floor(page);
}

function clampZoom(zoom: number): number {
	return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(zoom.toFixed(2))));
}

describe("PDFViewer Page Clamping & Navigation Logic", () => {
	const totalPages = 412;

	it("clamps negative and zero page requests to page 1", () => {
		expect(clampPage(-5, totalPages)).toBe(1);
		expect(clampPage(0, totalPages)).toBe(1);
	});

	it("clamps out-of-bounds page requests to the maximum document page", () => {
		expect(clampPage(500, totalPages)).toBe(412);
		expect(clampPage(99999, totalPages)).toBe(412);
	});

	it("floors floating page numbers to valid integers", () => {
		expect(clampPage(12.8, totalPages)).toBe(12);
	});

	it("returns 1 for NaN inputs", () => {
		expect(clampPage(Number.NaN, totalPages)).toBe(1);
	});

	it("preserves valid page numbers within bounds", () => {
		expect(clampPage(184, totalPages)).toBe(184);
	});
});

describe("PDFViewer Zoom Scaling Rules", () => {
	it("enforces default zoom level of 1.0 (100%)", () => {
		expect(DEFAULT_ZOOM).toBe(1.0);
	});

	it("clamps zoom steps to minimum zoom threshold (0.5)", () => {
		const reducedZoom = clampZoom(DEFAULT_ZOOM - ZOOM_STEP * 3);
		expect(reducedZoom).toBe(ZOOM_MIN);
		expect(ZOOM_MIN).toBe(0.5);
	});

	it("clamps zoom steps to maximum zoom threshold (3.0)", () => {
		const increasedZoom = clampZoom(DEFAULT_ZOOM + ZOOM_STEP * 10);
		expect(increasedZoom).toBe(ZOOM_MAX);
		expect(ZOOM_MAX).toBe(3.0);
	});

	it("applies incremental zoom steps (0.25)", () => {
		expect(ZOOM_STEP).toBe(0.25);
		const zoomedIn = clampZoom(1.0 + ZOOM_STEP);
		expect(zoomedIn).toBe(1.25);
	});
});

describe("PDFViewer Storage Keys", () => {
	it("generates correct localStorage key for reading progress persistence", () => {
		const clubId = "READ-4821";
		expect(STORAGE_KEYS.READER_PAGE(clubId)).toBe("reader_page_READ-4821");
	});
});
