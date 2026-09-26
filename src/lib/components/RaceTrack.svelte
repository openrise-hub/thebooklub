<script lang="ts">
interface RaceMember {
	id: string;
	username: string;
	avatarUrl: string;
	currentPage: number;
}

interface Props {
	members: RaceMember[];
	totalPages: number;
}

let { members = [], totalPages = 1 }: Props = $props();

const checkpoints = [
	{ label: "Start", percent: 0 },
	{ label: "25%", percent: 25 },
	{ label: "50%", percent: 50 },
	{ label: "75%", percent: 75 },
	{ label: "Finish 🏁", percent: 100 },
];

function getMemberPercent(currentPage: number): number {
	if (totalPages <= 0) return 0;
	const ratio = (currentPage / totalPages) * 100;
	return Math.min(100, Math.max(0, Math.round(ratio)));
}
</script>

<div class="race-track-wrapper">
	<div class="race-header">
		<div class="race-title-group">
			<span class="race-icon" aria-hidden="true">🏎️</span>
			<h3 class="race-title">Social Reading Race</h3>
		</div>
		<span class="race-stats">{members.length} {members.length === 1 ? "Reader" : "Readers"} on the track</span>
	</div>

	<div class="track-card">
		<div class="track-bar" role="progressbar" aria-valuemin={0} aria-valuemax={totalPages} aria-label="Reading progress race">
			{#each checkpoints as point}
				<div class="checkpoint-line" style="left: {point.percent}%;">
					<span class="checkpoint-label">{point.label}</span>
				</div>
			{/each}

			<div class="racers-layer">
				{#each members as member (member.id)}
					{@const percent = getMemberPercent(member.currentPage)}
					<div
						class="racer-node"
						style="left: calc({percent}% - 18px);"
						tabindex="0"
						role="group"
						aria-label="{member.username}: page {member.currentPage} of {totalPages} ({percent}%)"
					>
						<img
							src={member.avatarUrl}
							alt={member.username}
							class="racer-avatar"
						/>
						<div class="racer-tooltip">
							<span class="tooltip-name">{member.username}</span>
							<span class="tooltip-page">Page {member.currentPage} / {totalPages} ({percent}%)</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.race-track-wrapper {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
	}

	.race-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}

	.race-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.race-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.race-title {
		font-family: var(--font-sans);
		font-size: 1.15rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
	}

	.race-stats {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.track-card {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: var(--radius-lg);
		box-shadow: var(--depth-card);
		padding: 32px 20px 24px 20px;
		position: relative;
	}

	.track-bar {
		position: relative;
		height: 36px;
		background-color: var(--bg-surface-elevated);
		border: 2.5px solid var(--border-color);
		border-radius: var(--radius-md);
		width: 100%;
	}

	.checkpoint-line {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background-color: var(--border-color);
		opacity: 0.35;
		transform: translateX(-50%);
	}

	.checkpoint-label {
		position: absolute;
		top: -24px;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.racers-layer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	.racer-node {
		position: absolute;
		top: -6px;
		width: 36px;
		height: 36px;
		cursor: pointer;
		outline: none;
		z-index: 5;
		transition: transform 0.15s ease, z-index 0.1s ease;
	}

	.racer-node:hover,
	.racer-node:focus-visible {
		transform: scale(1.2) translateY(-4px);
		z-index: 20;
	}

	.racer-avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2.5px solid var(--border-color);
		background-color: var(--bg-surface);
		object-fit: cover;
		box-shadow: 0 3px 0 var(--border-color);
		display: block;
	}

	.racer-tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(-6px);
		background-color: var(--text-primary);
		color: var(--bg-surface);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 700;
		display: flex;
		flex-direction: column;
		align-items: center;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s ease, transform 0.15s ease;
		box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
	}

	.racer-node:hover .racer-tooltip,
	.racer-node:focus-visible .racer-tooltip {
		opacity: 1;
		transform: translateX(-50%) translateY(-10px);
	}

	.tooltip-name {
		font-weight: 900;
	}

	.tooltip-page {
		opacity: 0.85;
		font-size: 0.7rem;
	}

	@media (max-width: 600px) {
		.track-card {
			padding: 28px 12px 20px 12px;
		}

		.checkpoint-label {
			font-size: 0.65rem;
		}

		.racer-node {
			width: 32px;
			height: 32px;
			top: -4px;
		}
	}
</style>
