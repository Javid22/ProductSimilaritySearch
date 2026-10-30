import { scoreTier, toPercent } from "../lib/catalog";

/** Myntra puts the rating chip bottom-left on the image; we put the match score there. */
export function MatchChip({ score }: { score: number }) {
  const tier = scoreTier(score);
  return (
    <span className={`match-chip tone-${tier.tone}`} title={`${tier.label} · cosine similarity ${score.toFixed(4)}`}>
      <span className="match-dot" />
      <b>{toPercent(score)}%</b>
      <span className="match-sep" />
      match
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const tier = scoreTier(score);
  return (
    <span className={`score-bar tone-${tier.tone}`} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={score} aria-label="Similarity score">
      <span style={{ width: `${Math.max(4, toPercent(score))}%` }} />
    </span>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const tier = scoreTier(score);
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className={`score-ring tone-${tier.tone}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle
          cx="50" cy="50" r={r}
          className="ring-value"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, score)))}
        />
      </svg>
      <div className="ring-label">
        <b>{toPercent(score)}<small>%</small></b>
        <span>match</span>
      </div>
    </div>
  );
}
