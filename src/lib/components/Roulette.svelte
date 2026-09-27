<script lang="ts">
import {
	type CandidateBook,
	calculateSpinTargetAngle,
	calculateWheelSlices,
} from "$lib/club/roulette";
import { MIN_CANDIDATE_BOOKS } from "$lib/constants/club";
import { ROULETTE_EASING_CSS, ROULETTE_SPIN_DURATION_MS } from "$lib/constants/selection";
import Button from "./Button.svelte";
import Modal from "./Modal.svelte";

interface Props {
	candidates: CandidateBook[];
	onspin?: () => Promise<{ winnerIndex: number }>;
	onsetactive?: (winner: CandidateBook) => void;
	disabled?: boolean;
}

const { candidates = [], onspin, onsetactive, disabled = false }: Props = $props();

let isSpinning = $state(false);
let rotationAngle = $state(0);
let winningCandidate = $state<CandidateBook | null>(null);
let showWinnerModal = $state(false);
let spinError = $state<string | null>(null);

const wheelSlices = $derived(calculateWheelSlices(candidates, 175, { x: 200, y: 200 }));
const canSpin = $derived(candidates.length >= MIN_CANDIDATE_BOOKS && !isSpinning && !disabled);

async function handleSpin() {
	if (!canSpin || !onspin) return;

	isSpinning = true;
	spinError = null;

	try {
		const result = await onspin();
		const winnerIdx = result.winnerIndex;
		const targetAngle = calculateSpinTargetAngle(winnerIdx, candidates.length, rotationAngle);

		rotationAngle = targetAngle;

		setTimeout(() => {
			isSpinning = false;
			winningCandidate = candidates[winnerIdx] || null;
			if (winningCandidate) {
				showWinnerModal = true;
			}
		}, ROULETTE_SPIN_DURATION_MS);
	} catch (err) {
		isSpinning = false;
		spinError = err instanceof Error ? err.message : "Failed to execute spin";
	}
}

function handleSetActive() {
	if (winningCandidate && onsetactive) {
		onsetactive(winningCandidate);
		showWinnerModal = false;
	}
}
</script>

<div class="roulette-container" aria-label="Book Selection Roulette">
	<!-- Top Ticker / Pointer -->
	<div class="pointer-wrapper" aria-hidden="true">
		<svg viewBox="0 0 32 36" width="32" height="36" class="pointer-svg">
			<path d="M16 34 L2 6 A 4 4 0 0 1 6 2 L26 2 A 4 4 0 0 1 30 6 Z" fill="#FFA602" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
			<circle cx="16" cy="10" r="4" fill="#1A1A1A" />
		</svg>
	</div>

	<!-- Wheel Frame & Rotating Disk -->
	<div class="wheel-stage">
		<div
			class="wheel-rotator"
			class:is-animating={isSpinning}
			style="transform: rotate({rotationAngle}deg); transition: transform {ROULETTE_SPIN_DURATION_MS}ms {ROULETTE_EASING_CSS};"
		>
			<svg viewBox="0 0 400 400" width="360" height="360" class="wheel-svg">
				<!-- Outer Chunky Rim -->
				<circle cx="200" cy="200" r="195" fill="#1A1A1A" />
				<circle cx="200" cy="200" r="185" fill="#242834" stroke="#1A1A1A" stroke-width="3" />

				<!-- Slices -->
				<g class="slices-layer">
					{#each wheelSlices as slice (slice.index)}
						<path
							d={slice.pathData}
							fill={slice.candidate.colorHex}
							stroke="#1A1A1A"
							stroke-width="3"
							stroke-linejoin="round"
						/>
						<g transform="rotate({slice.textRotation}, {slice.textX}, {slice.textY})">
							<text
								x={slice.textX}
								y={slice.textY}
								fill="#FFFFFF"
								font-size="12"
								font-weight="900"
								font-family="sans-serif"
								text-anchor="middle"
								dominant-baseline="central"
								class="slice-title-text"
							>
								#{slice.index + 1} {slice.candidate.title.slice(0, 14)}
							</text>
						</g>
					{/each}
				</g>

				<!-- Center Hub -->
				<circle cx="200" cy="200" r="36" fill="#1A1A1A" />
				<circle cx="200" cy="200" r="28" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="3" />
				<circle cx="200" cy="200" r="12" fill="#FFA602" stroke="#1A1A1A" stroke-width="2" />
			</svg>
		</div>
	</div>

	<!-- Spin Button Control -->
	<div class="wheel-controls">
		{#if spinError}
			<div class="spin-error-banner" role="alert">
				{spinError}
			</div>
		{/if}

		<Button
			variant="yellow"
			size="lg"
			disabled={!canSpin}
			onclick={handleSpin}
			ariaLabel="Spin the roulette wheel"
		>
			{#if isSpinning}
				<span class="btn-text-content">
					<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3">
						<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"/>
					</svg>
					<span>Spinning Wheel...</span>
				</span>
			{:else}
				<span class="btn-text-content">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
					</svg>
					<span>SPIN WHEEL!</span>
				</span>
			{/if}
		</Button>
	</div>
</div>

<!-- Winner Celebration Modal -->
<Modal isOpen={showWinnerModal} title="🎉 We Have a Winner!" onclose={() => (showWinnerModal = false)}>
	{#if winningCandidate}
		<div class="winner-modal-content">
			<!-- Confetti Sprinkles -->
			<div class="confetti-container" aria-hidden="true">
				<div class="confetti p1"></div>
				<div class="confetti p2"></div>
				<div class="confetti p3"></div>
				<div class="confetti p4"></div>
				<div class="confetti p5"></div>
				<div class="confetti p6"></div>
			</div>

			<div class="winner-card" style="border-color: {winningCandidate.colorHex};">
				<div class="winner-stripe" style="background-color: {winningCandidate.colorHex};"></div>

				<div class="winner-cover-box">
					{#if winningCandidate.coverUrl}
						<img src={winningCandidate.coverUrl} alt={winningCandidate.title} class="winner-cover-img" />
					{:else}
						<div class="winner-cover-fallback">
							<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
								<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
							</svg>
						</div>
					{/if}
				</div>

				<div class="winner-info">
					<span class="winner-tag" style="color: {winningCandidate.colorHex};">Selected Read</span>
					<h3 class="winner-title">{winningCandidate.title}</h3>
					<p class="winner-author">by {winningCandidate.author}</p>
					<span class="winner-pages">{winningCandidate.totalPages} pages</span>
				</div>
			</div>

			<div class="winner-actions">
				<Button
					variant="green"
					size="lg"
					fullWidth
					onclick={handleSetActive}
					ariaLabel="Set {winningCandidate.title} as active club reading cycle"
				>
					Set as Active Reading Cycle
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.roulette-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		width: 100%;
		max-width: 440px;
		margin: 0 auto;
		padding: 20px 0;
	}

	.pointer-wrapper {
		position: relative;
		z-index: 20;
		margin-bottom: -18px;
		filter: drop-shadow(0 4px 0 #1a1a1a);
	}

	.pointer-svg {
		display: block;
	}

	.wheel-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 360px;
		height: 360px;
		position: relative;
		box-shadow: 0 10px 0 #1a1a1a;
		border-radius: 50%;
	}

	.wheel-rotator {
		width: 100%;
		height: 100%;
		will-change: transform;
	}

	.wheel-svg {
		display: block;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	.slice-title-text {
		text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
	}

	.wheel-controls {
		margin-top: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		width: 100%;
	}

	.btn-text-content {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.spin-error-banner {
		padding: 8px 12px;
		background-color: var(--color-red-base);
		color: var(--color-red-text);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.85rem;
	}

	/* Winner Modal */
	.winner-modal-content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		text-align: center;
		padding: 10px 0;
	}

	.winner-card {
		display: flex;
		align-items: center;
		gap: 16px;
		background-color: var(--bg-surface-elevated);
		border: 3px solid;
		border-radius: var(--radius-md);
		box-shadow: 0 6px 0 var(--border-color);
		padding: 16px;
		width: 100%;
		position: relative;
		overflow: hidden;
		text-align: left;
	}

	.winner-stripe {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 8px;
	}

	.winner-cover-box {
		width: 70px;
		height: 100px;
		flex-shrink: 0;
	}

	.winner-cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 2.5px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 3px 0 var(--border-color);
	}

	.winner-cover-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-surface);
		border: 2.5px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 3px 0 var(--border-color);
		color: var(--text-muted);
	}

	.winner-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.winner-tag {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.winner-title {
		font-size: 1.2rem;
		font-weight: 900;
		line-height: 1.2;
		word-break: break-word;
	}

	.winner-author {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.winner-pages {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--text-muted);
	}

	.winner-actions {
		width: 100%;
	}

	/* Confetti animation */
	.confetti-container {
		position: absolute;
		top: -20px;
		left: 0;
		right: 0;
		height: 100px;
		pointer-events: none;
		overflow: hidden;
	}

	.confetti {
		position: absolute;
		width: 10px;
		height: 10px;
		border: 1.5px solid #1a1a1a;
		animation: fall 1.5s ease-out infinite;
	}

	.p1 { left: 15%; background-color: #e21b3c; animation-delay: 0.1s; }
	.p2 { left: 30%; background-color: #1368ce; animation-delay: 0.3s; }
	.p3 { left: 45%; background-color: #ffa602; animation-delay: 0.2s; }
	.p4 { left: 60%; background-color: #26890c; animation-delay: 0.4s; }
	.p5 { left: 75%; background-color: #6a2cd8; animation-delay: 0.15s; }
	.p6 { left: 90%; background-color: #ffa602; animation-delay: 0.35s; }

	@keyframes fall {
		0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
		100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
	}

	@media (max-width: 400px) {
		.wheel-stage {
			width: 300px;
			height: 300px;
		}

		.wheel-svg {
			width: 300px;
			height: 300px;
		}
	}
</style>
