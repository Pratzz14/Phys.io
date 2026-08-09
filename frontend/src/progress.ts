import type { ExerciseSessionSummary, LiveExerciseId } from "./types";

export const PROGRESS_WEEK_COUNT = 12;
export type ProgressExerciseFilter = "all" | LiveExerciseId;
export type ProgressMetric = "repetitions" | "accuracy" | "activeTime";

export interface WeeklyProgressPoint {
  key: string;
  label: string;
  dateRangeLabel: string;
  repetitions: number;
  activeSeconds: number;
  averageAccuracy: number | null;
  sessionCount: number;
}

export interface ProgressSummary {
  repetitions: number;
  activeSeconds: number;
  averageAccuracy: number | null;
  sessionCount: number;
  weeks: WeeklyProgressPoint[];
}

interface MutableWeek extends WeeklyProgressPoint {
  accuracyWeightedTotal: number;
  accuracySampleCount: number;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfLocalWeek(value: Date): Date {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function addLocalDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateRange(start: Date): string {
  const end = addLocalDays(start, 6);
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

export function progressWindowStart(now: Date, weekCount = PROGRESS_WEEK_COUNT): Date {
  return addLocalDays(startOfLocalWeek(now), -(weekCount - 1) * 7);
}

export function buildProgressSummary(
  sessions: ExerciseSessionSummary[],
  exerciseFilter: ProgressExerciseFilter,
  now: Date,
  weekCount = PROGRESS_WEEK_COUNT,
): ProgressSummary {
  const firstWeek = progressWindowStart(now, weekCount);
  const weeks: MutableWeek[] = Array.from({ length: weekCount }, (_, index) => {
    const start = addLocalDays(firstWeek, index * 7);
    return {
      key: localDateKey(start),
      label: `Week ${index + 1}`,
      dateRangeLabel: formatDateRange(start),
      repetitions: 0,
      activeSeconds: 0,
      averageAccuracy: null,
      sessionCount: 0,
      accuracyWeightedTotal: 0,
      accuracySampleCount: 0,
    };
  });
  const weekByKey = new Map(weeks.map((week) => [week.key, week]));
  let repetitions = 0;
  let activeSeconds = 0;
  let accuracyWeightedTotal = 0;
  let accuracySampleCount = 0;
  let sessionCount = 0;

  for (const session of sessions) {
    if (exerciseFilter !== "all" && session.exercise_id !== exerciseFilter) continue;
    const occurredAt = new Date(session.last_active_at);
    if (Number.isNaN(occurredAt.getTime()) || occurredAt < firstWeek || occurredAt > now) continue;
    const week = weekByKey.get(localDateKey(startOfLocalWeek(occurredAt)));
    if (!week) continue;
    week.repetitions += session.repetitions;
    week.activeSeconds += session.active_seconds;
    week.sessionCount += 1;
    week.accuracyWeightedTotal += session.average_accuracy * session.accuracy_sample_count;
    week.accuracySampleCount += session.accuracy_sample_count;
    repetitions += session.repetitions;
    activeSeconds += session.active_seconds;
    sessionCount += 1;
    accuracyWeightedTotal += session.average_accuracy * session.accuracy_sample_count;
    accuracySampleCount += session.accuracy_sample_count;
  }

  for (const week of weeks) {
    week.averageAccuracy = week.accuracySampleCount > 0
      ? week.accuracyWeightedTotal / week.accuracySampleCount
      : null;
  }

  return {
    repetitions,
    activeSeconds,
    averageAccuracy: accuracySampleCount > 0 ? accuracyWeightedTotal / accuracySampleCount : null,
    sessionCount,
    weeks: weeks.map(({ accuracyWeightedTotal: _weighted, accuracySampleCount: _count, ...week }) => week),
  };
}

export function metricValue(point: WeeklyProgressPoint, metric: ProgressMetric): number | null {
  if (metric === "repetitions") return point.repetitions;
  if (metric === "activeTime") return point.activeSeconds / 60;
  return point.averageAccuracy;
}

export function formatActiveTime(seconds: number): string {
  const roundedMinutes = Math.round(seconds / 60);
  if (roundedMinutes < 60) return `${roundedMinutes}m`;
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
