import {
  createExerciseSessionAccumulator,
  LatestSessionSaveQueue,
  nextSessionSnapshot,
  recordValidTracking,
  sessionNeedsAutosave,
  setSessionRepetitions,
} from "./exerciseSessionMetrics";
import type { ExerciseSessionSummary } from "./types";

test("collects only continuous valid time and averages displayed accuracy", () => {
  const session = createExerciseSessionAccumulator("hands-up-down", "11111111-1111-4111-8111-111111111111");
  recordValidTracking(session, 1_000, null, 750);
  recordValidTracking(session, 1_400, 80, 750);
  recordValidTracking(session, 2_000, 90, 750);
  recordValidTracking(session, 3_000, 70, 750);
  expect(session.activeMs).toBe(1_000);
  expect(session.accuracySampleCount).toBe(3);
  expect(sessionNeedsAutosave(session)).toBe(false);

  setSessionRepetitions(session, 1);
  expect(sessionNeedsAutosave(session)).toBe(true);
  expect(nextSessionSnapshot(session)).toMatchObject({
    active_seconds: 1,
    repetitions: 1,
    average_accuracy: 80,
    accuracy_sample_count: 3,
    revision: 1,
  });
});

test("does not create a persisted snapshot before the first repetition", () => {
  const session = createExerciseSessionAccumulator("hands-side-up", "22222222-2222-4222-8222-222222222222");
  recordValidTracking(session, 1_000, 86, 750);
  recordValidTracking(session, 1_500, 88, 750);
  expect(nextSessionSnapshot(session)).toBeNull();
});

test("coalesces queued saves to the newest revision", async () => {
  let resolveFirst!: (value: ExerciseSessionSummary) => void;
  const firstSave = new Promise<ExerciseSessionSummary>((resolve) => { resolveFirst = resolve; });
  const savedRevisions: number[] = [];
  const save = vi.fn((snapshot: ExerciseSessionSummary) => {
    savedRevisions.push(snapshot.revision);
    if (snapshot.revision === 1) return firstSave;
    return Promise.resolve(snapshot);
  });
  const queue = new LatestSessionSaveQueue(save, vi.fn());
  const base: ExerciseSessionSummary = {
    session_id: "33333333-3333-4333-8333-333333333333",
    exercise_id: "hands-up-down",
    started_at: "2026-08-09T10:00:00.000Z",
    last_active_at: "2026-08-09T10:01:00.000Z",
    active_seconds: 45,
    repetitions: 1,
    average_accuracy: 84,
    accuracy_sample_count: 12,
    revision: 1,
  };

  queue.enqueue(base);
  queue.enqueue({ ...base, repetitions: 2, revision: 2 });
  queue.enqueue({ ...base, repetitions: 3, revision: 3 });
  resolveFirst(base);

  await vi.waitFor(() => expect(savedRevisions).toEqual([1, 3]));
  queue.dispose();
});
