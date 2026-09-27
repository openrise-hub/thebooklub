<script lang="ts">
import { type RaceMember, formatRacerTooltip, groupMembersByPosition } from "$lib/club/progress";
import Avatar from "./Avatar.svelte";

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
	{ label: "Finish", percent: 100 },
];

const racerGroups = $derived(groupMembersByPosition(members, totalPages));
</script>

<div class="race-track-wrapper" aria-label="Social Reading Race Track">
	<div class="race-header">
		<div class="race-title-group">
			<span class="race-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
					<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>
				</svg>
			</span>
			<h3 class="race-title">Social Reading Race</h3>
		</div>
		<span class="race-stats">
			{members.length} {members.length === 1 ? "Reader" : "Readers"} on the track
		</span>
	</div>

	<div class="track-card">
		<div
			class="track-bar"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={Math.max(1, totalPages)}
			aria-label="Reading progress race"
		>
			{#each checkpoints as point}
				<div class="checkpoint-line" style="left: {point.percent}%;">
					<span class="checkpoint-label">{point.label}</span>
				</div>
			{/each}

			<div class="racers-layer" aria-label="Racers on track">
				{#each racerGroups as group (group.page)}
					{@const tooltip = formatRacerTooltip(group.members, group.page, totalPages, group.percent)}
					<button
						type="button"
						class="racer-cluster-node"
						class:is-tie={group.members.length > 1}
						style="left: calc({group.percent}% - 18px);"
						aria-label="{tooltip.title}: {tooltip.subtitle}"
					>
						<div class="avatar-stack">
							{#each group.members as member, idx (member.id)}
								<div class="stacked-avatar-wrapper" style="z-index: {idx + 1};">
									<Avatar
										src={member.avatarUrl}
										username={member.username}
										size="sm"
									/>
								</div>
							{/each}
						</div>

						<div class="racer-tooltip" role="tooltip">
							<span class="tooltip-name">{tooltip.title}</span>
							<span class="tooltip-page">{tooltip.subtitle}</span>
						</div>
					</button>
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
		display: flex;
		align-items: center;
		color: var(--color-yellow);
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
		box-shadow: 0 4px 0 var(--border-color);
		padding: 36px 20px 24px 20px;
		position: relative;
	}

	.track-bar {
		position: relative;
		height: 40px;
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

	.racer-cluster-node {
		position: absolute;
		top: -4px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		outline: none;
		z-index: 5;
		transition: transform 0.15s ease, z-index 0.1s ease;
	}

	.racer-cluster-node:hover,
	.racer-cluster-node:focus-visible {
		transform: scale(1.15) translateY(-6px);
		z-index: 30;
	}

	.avatar-stack {
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
		margin-top: -6px;
	}

	.stacked-avatar-wrapper {
		margin-top: -12px;
		transition: transform 0.1s ease;
	}

	.stacked-avatar-wrapper:last-child {
		margin-top: 0;
	}

	.racer-cluster-node:hover .stacked-avatar-wrapper,
	.racer-cluster-node:focus-visible .stacked-avatar-wrapper {
		margin-top: -4px;
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
		box-shadow: 0 4px 0 var(--border-color);
		z-index: 40;
	}

	.racer-cluster-node:hover .racer-tooltip,
	.racer-cluster-node:focus-visible .racer-tooltip {
		opacity: 1;
		transform: translateX(-50%) translateY(-12px);
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
			padding: 30px 12px 20px 12px;
		}

		.checkpoint-label {
			font-size: 0.65rem;
		}
	}
</style>
