import {
	ROULETTE_MIN_ROTATIONS,
	ROULETTE_POINTER_ANGLE_DEG,
	type SelectionThemeColor,
} from "$lib/constants/selection";

export interface CandidateBook {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	totalPages: number;
	themeColor: SelectionThemeColor;
	colorHex: string;
}

export interface WheelSlice {
	index: number;
	candidate: CandidateBook;
	startAngle: number;
	endAngle: number;
	midAngle: number;
	pathData: string;
	textX: number;
	textY: number;
	textRotation: number;
}

export function polarToCartesian(
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
): { x: number; y: number } {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}

export function calculateWheelSlices(
	candidates: CandidateBook[],
	radius = 180,
	center: { x: number; y: number } = { x: 200, y: 200 },
): WheelSlice[] {
	if (!candidates || candidates.length === 0) return [];

	const sliceAngle = 360 / candidates.length;
	const textRadius = radius * 0.65;

	return candidates.map((candidate, index) => {
		const startAngle = index * sliceAngle;
		const endAngle = (index + 1) * sliceAngle;
		const midAngle = startAngle + sliceAngle / 2;

		const start = polarToCartesian(center.x, center.y, radius, endAngle);
		const end = polarToCartesian(center.x, center.y, radius, startAngle);
		const largeArcFlag = sliceAngle <= 180 ? "0" : "1";

		const pathData = [
			`M ${center.x} ${center.y}`,
			`L ${start.x} ${start.y}`,
			`A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
			"Z",
		].join(" ");

		const textPos = polarToCartesian(center.x, center.y, textRadius, midAngle);
		const textRotation = midAngle;

		return {
			index,
			candidate,
			startAngle,
			endAngle,
			midAngle,
			pathData,
			textX: textPos.x,
			textY: textPos.y,
			textRotation,
		};
	});
}

export function calculateSpinTargetAngle(
	winnerIndex: number,
	totalCandidates: number,
	currentRotation = 0,
	numRotations: number = ROULETTE_MIN_ROTATIONS,
): number {
	if (totalCandidates <= 0) return currentRotation;

	const sliceAngle = 360 / totalCandidates;
	const safeWinner = Math.max(0, Math.min(totalCandidates - 1, winnerIndex));
	const sliceCenterAngle = safeWinner * sliceAngle + sliceAngle / 2;

	// Pointer is at the top (0 degrees in polarToCartesian angle system)
	const desiredAlignment = (360 - sliceCenterAngle) % 360;
	const baseTurns = (Math.floor(currentRotation / 360) + numRotations) * 360;

	return baseTurns + desiredAlignment;
}

export function pickRandomWinnerIndex(totalCandidates: number): number {
	if (totalCandidates <= 0) return 0;
	return Math.floor(Math.random() * totalCandidates);
}
