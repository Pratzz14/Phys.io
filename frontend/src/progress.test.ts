import { buildProgressSummary, progressWindowStart, startOfLocalWeek } from "./progress";
import type { ExerciseSessionSummary, LiveExerciseId } from "./types";

function session(
  id: string,
  exerciseId: LiveExerciseId,
  occurredAt: Date,
  repetitions: number,
  activeSeconds: number,
  averageAccuracy: number,
  accuracySampleCount: number,
): ExerciseSessionSummary {
  return {
    session_id: id,
    exercise_id: exerciseId,
    started_at: new Date(occurredAt.getTime() - activeSeconds * 1_000).toISOString(),
    last_active_at: occurredAt.toISOString(),
    active_seconds: activeSeconds,
    repetitions,
    average_accuracy: averageAccuracy,
    accuracy_sample_count: accuracySampleCount,
    revision: 1,
  };
}

test("uses Monday-based local weeks and returns a 12-week window", () => {
  const sunday = new Date(2026, 7, 9, 12);
  const monday = startOfLocalWeek(sunday);
  expect(monday.getDay()).toBe(1);
  expect(monday.getDate()).toBe(3);
  const start = progressWindowStart(sunday);
  expect(start.getDay()).toBe(1);
  const summary = buildProgressSummary([], "all", sunday);
  expect(summary.weeks).toHaveLength(12);
  expect(summary.weeks[0].key).toBe(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`);
});

test("aggregates reps and time while weighting accuracy by sample count", () => {
  const now = new Date(2026, 7, 9, 20);
  const currentMonday = startOfLocalWeek(now);
  const first = new Date(currentMonday); first.setDate(first.getDate() + 1); first.setHours(10);
  const second = new Date(currentMonday); second.setDate(second.getDate() + 3); second.setHours(11);
  const sessions = [
    session("one", "hands-up-down", first, 4, 120, 80, 1),
    session("two", "hands-side-up", second, 6, 180, 90, 3),
  ];
  const summary = buildProgressSummary(sessions, "all", now);
  expect(summary.repetitions).toBe(10);
  expect(summary.activeSeconds).toBe(300);
  expect(summary.averageAccuracy).toBe(87.5);
  expect(summary.sessionCount).toBe(2);
  expect(summary.weeks.at(-1)).toMatchObject({ repetitions: 10, activeSeconds: 300, averageAccuracy: 87.5 });
  expect(summary.weeks[0].averageAccuracy).toBeNull();

  const filtered = buildProgressSummary(sessions, "hands-up-down", now);
  expect(filtered.repetitions).toBe(4);
  expect(filtered.averageAccuracy).toBe(80);
  expect(filtered.sessionCount).toBe(1);
});
