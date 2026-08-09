import { useId, useMemo, useState } from "react";
import { exercises } from "../data/exercises";
import {
  buildProgressSummary,
  formatActiveTime,
  metricValue,
  type ProgressExerciseFilter,
  type ProgressMetric,
  type WeeklyProgressPoint,
} from "../progress";
import type { ExerciseSessionSummary, LiveExerciseId } from "../types";
import { ClockIcon, InfoIcon, RepeatIcon, TargetIcon } from "./Icons";

const METRICS: Array<{ id: ProgressMetric; label: string }> = [
  { id: "repetitions", label: "Repetitions" },
  { id: "accuracy", label: "Accuracy" },
  { id: "activeTime", label: "Active time" },
];

function formatMetricValue(value: number, metric: ProgressMetric): string {
  if (metric === "accuracy") return `${Math.round(value)}%`;
  if (metric === "activeTime") return `${Math.round(value)}m`;
  return Math.round(value).toLocaleString();
}

function niceMaximum(values: Array<number | null>, metric: ProgressMetric): number {
  if (metric === "accuracy") return 100;
  const maximum = Math.max(0, ...values.map((value) => value ?? 0));
  if (maximum <= 0) return metric === "activeTime" ? 10 : 5;
  const roughStep = maximum / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceStep * magnitude * 4;
}

function TrendChart({ weeks, metric }: { weeks: WeeklyProgressPoint[]; metric: ProgressMetric }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const width = 1200;
  const height = 360;
  const left = 62;
  const right = 24;
  const top = 34;
  const bottom = 78;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = weeks.map((week) => metricValue(week, metric));
  const yMaximum = niceMaximum(values, metric);
  const points = weeks.map((week, index) => {
    const value = values[index];
    return {
      week,
      value,
      x: left + (plotWidth * index) / Math.max(1, weeks.length - 1),
      y: value === null ? null : top + plotHeight * (1 - value / yMaximum),
    };
  });
  const paths: string[] = [];
  let segment: string[] = [];
  for (const point of points) {
    if (point.y === null) {
      if (segment.length) paths.push(segment.join(" "));
      segment = [];
    } else {
      segment.push(`${segment.length ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    }
  }
  if (segment.length) paths.push(segment.join(" "));
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const tooltipX = activePoint ? Math.min(width - 174, Math.max(left, activePoint.x - 76)) : 0;
  const tooltipY = activePoint?.y === null || activePoint?.y === undefined
    ? 0
    : Math.max(8, activePoint.y - 94);
  const metricLabel = METRICS.find((item) => item.id === metric)?.label ?? "Progress";

  return (
    <div className="progress-chart-wrap">
      <svg
        className="progress-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <title id={titleId}>{metricLabel} over 12 weeks</title>
        <desc id={descriptionId}>Weekly {metricLabel.toLowerCase()} for saved live exercise sessions. Focus a data point to hear its value.</desc>
        {Array.from({ length: 5 }, (_, index) => {
          const value = yMaximum - (yMaximum * index) / 4;
          const y = top + (plotHeight * index) / 4;
          return (
            <g key={value} className="progress-grid-line">
              <line x1={left} x2={width - right} y1={y} y2={y} />
              <text x={left - 12} y={y + 4} textAnchor="end">{formatMetricValue(value, metric)}</text>
            </g>
          );
        })}
        <line className="progress-axis" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />
        {paths.map((path, index) => <path className="progress-line" d={path} key={`${path}-${index}`} />)}
        {points.map((point, index) => {
          const mobileVisible = index % 3 === 0 || index === points.length - 1;
          return (
            <g key={point.week.key}>
              {point.y !== null ? (
                <g
                  className="progress-point"
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.week.label}, ${point.week.dateRangeLabel}: ${formatMetricValue(point.value ?? 0, metric)}`}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                >
                  <circle cx={point.x} cy={point.y} r={activeIndex === index ? 8 : 6} />
                  <text className="progress-value-label" x={point.x} y={point.y - 16} textAnchor="middle">{formatMetricValue(point.value ?? 0, metric)}</text>
                </g>
              ) : null}
              <g className={`progress-x-label ${mobileVisible ? "" : "progress-x-label-mobile-hidden"}`}>
                <text x={point.x} y={height - 42} textAnchor="middle">{point.week.label}</text>
                <text className="progress-x-date" x={point.x} y={height - 20} textAnchor="middle">{point.week.dateRangeLabel}</text>
              </g>
            </g>
          );
        })}
        {activePoint?.y !== null && activePoint?.y !== undefined ? (
          <g className="progress-tooltip" aria-hidden="true">
            <rect x={tooltipX} y={tooltipY} width="152" height="72" rx="8" />
            <text className="progress-tooltip-week" x={tooltipX + 12} y={tooltipY + 23}>{activePoint.week.label}</text>
            <text x={tooltipX + 12} y={tooltipY + 42}>{activePoint.week.dateRangeLabel}</text>
            <text className="progress-tooltip-value" x={tooltipX + 12} y={tooltipY + 61}>{formatMetricValue(activePoint.value ?? 0, metric)}</text>
          </g>
        ) : null}
      </svg>
      <table className="sr-only">
        <caption>{metricLabel} by week</caption>
        <thead><tr><th>Week</th><th>{metricLabel}</th></tr></thead>
        <tbody>
          {weeks.map((week) => {
            const value = metricValue(week, metric);
            return <tr key={week.key}><th>{week.label}, {week.dateRangeLabel}</th><td>{value === null ? "No data" : formatMetricValue(value, metric)}</td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProgressSection({
  sessions,
  loading,
  error,
  onRetry,
}: {
  sessions: ExerciseSessionSummary[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const [exerciseFilter, setExerciseFilter] = useState<ProgressExerciseFilter>("all");
  const [metric, setMetric] = useState<ProgressMetric>("repetitions");
  const now = new Date();
  const summary = useMemo(
    () => buildProgressSummary(sessions, exerciseFilter, now),
    [exerciseFilter, now.getDate(), now.getMonth(), now.getFullYear(), sessions],
  );
  const liveExercises = exercises.filter((exercise) => exercise.mode === "live");

  return (
    <section className="progress-section surface-panel" aria-labelledby="progress-heading">
      <div className="progress-header">
        <div>
          <h2 id="progress-heading">Progress over 12 weeks</h2>
          <p>See how your live exercise sessions are building over time.</p>
        </div>
        <div className="progress-metric-tabs" aria-label="Progress metric">
          {METRICS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={metric === item.id ? "active" : ""}
              aria-pressed={metric === item.id}
              onClick={() => setMetric(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <label className="progress-exercise-filter">
        <span>Exercise</span>
        <select value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value as ProgressExerciseFilter)}>
          <option value="all">All live exercises</option>
          {liveExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title}</option>)}
        </select>
      </label>

      <div className="progress-kpis" aria-live="polite">
        <div><span className="progress-kpi-icon"><RepeatIcon size={25} /></span><span><small>Repetitions</small><strong>{summary.repetitions.toLocaleString()}</strong></span></div>
        <div><span className="progress-kpi-icon"><TargetIcon size={25} /></span><span><small>Avg. accuracy</small><strong>{summary.averageAccuracy === null ? "—" : `${Math.round(summary.averageAccuracy)}%`}</strong></span></div>
        <div><span className="progress-kpi-icon"><ClockIcon size={25} /></span><span><small>Active time</small><strong>{formatActiveTime(summary.activeSeconds)}</strong></span></div>
      </div>

      {error ? (
        <div className="progress-state progress-error" role="alert">
          <p>We could not load your exercise progress.</p>
          <button type="button" className="secondary-button" onClick={onRetry}>Try again</button>
        </div>
      ) : loading ? (
        <div className="progress-state" role="status">Loading exercise progress…</div>
      ) : summary.sessionCount === 0 ? (
        <div className="progress-state progress-empty"><p>Complete your first live session to see progress.</p></div>
      ) : (
        <TrendChart weeks={summary.weeks} metric={metric} />
      )}

      <p className="progress-note"><InfoIcon size={17} /> Sessions are saved after your first completed repetition.</p>
    </section>
  );
}
