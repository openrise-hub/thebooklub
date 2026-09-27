<script lang="ts">
import {
	ADVANCED_CRITERIA_KEYS,
	type AdvancedCriteriaKey,
	CRITERIA_MAX_SCORE,
	CRITERIA_MIN_SCORE,
} from "$lib/constants/ratings";
import { type MessageKey, t } from "$lib/i18n";
import type { ReviewCriteriaScores } from "$lib/types/review";

interface Props {
	criteriaAverages?: Partial<Record<AdvancedCriteriaKey, number>> | ReviewCriteriaScores;
	totalReviews?: number;
	title?: string;
}

const {
	criteriaAverages = {},
	totalReviews = 0,
	title = t("ratings_breakdown_title"),
}: Props = $props();

const criteriaColors: Record<AdvancedCriteriaKey, string> = {
	plot: "var(--color-red)",
	characters: "var(--color-blue)",
	pacing: "var(--color-yellow)",
	writing: "var(--color-green)",
	emotion: "var(--color-purple)",
};

function getScore(key: AdvancedCriteriaKey): number {
	const val = criteriaAverages[key];
	if (typeof val !== "number" || Number.isNaN(val) || val < 0) {
		return 0;
	}
	return val;
}

function getPercentage(score: number): number {
	if (score <= 0) return 0;
	return Math.min(100, Math.max(0, (score / CRITERIA_MAX_SCORE) * 100));
}

function formatScore(score: number): string {
	if (score <= 0) return "0.0";
	return score.toFixed(1);
}
</script>

<div class="review-breakdown-card" aria-label="Review criteria score breakdown">
	<div class="breakdown-header">
		<div class="header-text-group">
			<h4 class="breakdown-title">{title}</h4>
			<span class="breakdown-subtitle">
				{t("ratings_club_average")} ({totalReviews})
			</span>
		</div>
		<div class="rubric-badge">
			<span class="rubric-badge-text">Rubric 1.0 - 5.0</span>
		</div>
	</div>

	<div class="criteria-list">
		{#each ADVANCED_CRITERIA_KEYS as key}
			{@const score = getScore(key)}
			{@const percent = getPercentage(score)}
			{@const color = criteriaColors[key]}

			<div class="criterion-item" data-criterion={key}>
				<div class="criterion-header">
					<div class="criterion-info">
						<span class="criterion-name">{t(`ratings_${key}_title` as MessageKey)}</span>
						<span class="criterion-desc">{t(`ratings_${key}_desc` as MessageKey)}</span>
					</div>
					<div class="criterion-score-badge">
						<span class="score-val" style="color: {color};">{formatScore(score)}</span>
						<span class="score-denom">/ {CRITERIA_MAX_SCORE}.0</span>
					</div>
				</div>

				<div
					class="criterion-bar-track"
					role="progressbar"
					aria-label="{t(`ratings_${key}_title` as MessageKey)} score"
					aria-valuenow={score}
					aria-valuemin={CRITERIA_MIN_SCORE}
					aria-valuemax={CRITERIA_MAX_SCORE}
				>
					<div
						class="criterion-bar-fill"
						style="width: {percent}%; background-color: {color};"
					></div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.review-breakdown-card {
		background-color: var(--bg-surface);
		border: var(--border-chunky);
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: 0 4px 0 var(--border-color);
	}

	.breakdown-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 12px;
	}

	.header-text-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.breakdown-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 900;
		color: var(--text-primary);
		letter-spacing: -0.2px;
	}

	.breakdown-subtitle {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.rubric-badge {
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		padding: 4px 8px;
	}

	.rubric-badge-text {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.criteria-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.criterion-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.criterion-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.criterion-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.criterion-name {
		font-size: 0.9rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.criterion-desc {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		line-height: 1.2;
	}

	.criterion-score-badge {
		display: inline-flex;
		align-items: baseline;
		gap: 3px;
		background-color: var(--bg-surface-elevated);
		border: 2px solid var(--border-color);
		border-radius: 4px;
		padding: 2px 6px;
		flex-shrink: 0;
	}

	.score-val {
		font-size: 0.95rem;
		font-weight: 900;
	}

	.score-denom {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.criterion-bar-track {
		height: 12px;
		background-color: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		overflow: hidden;
		position: relative;
	}

	.criterion-bar-fill {
		height: 100%;
		border-right: 2px solid var(--border-color);
		transition: width 0.2s ease-in-out;
	}

	@media (max-width: 600px) {
		.breakdown-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
