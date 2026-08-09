import type { ExerciseSessionSummary, LiveExerciseId } from "./types";

export const SESSION_AUTOSAVE_INTERVAL_MS = 15_000;
const MAX_SAVE_RETRIES = 3;

export interface ExerciseSessionAccumulator {
  sessionId: string;
  exerciseId: LiveExerciseId;
  startedAtMs: number | null;
  lastValidAtMs: number | null;
  activeMs: number;
  accuracyTotal: number;
  accuracySampleCount: number;
  repetitions: number;
  revision: number;
  lastQueuedActiveMs: number;
  lastQueuedRepetitions: number;
}

export function createSessionId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (!bytes.some(Boolean)) {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createExerciseSessionAccumulator(exerciseId: LiveExerciseId, sessionId = createSessionId()): ExerciseSessionAccumulator {
  return {
    sessionId,
    exerciseId,
    startedAtMs: null,
    lastValidAtMs: null,
    activeMs: 0,
    accuracyTotal: 0,
    accuracySampleCount: 0,
    repetitions: 0,
    revision: 0,
    lastQueuedActiveMs: 0,
    lastQueuedRepetitions: 0,
  };
}

export function recordValidTracking(
  session: ExerciseSessionAccumulator,
  observedAtMs: number,
  displayedAccuracy: number | null,
  maxContinuousGapMs: number,
): void {
  if (session.startedAtMs === null) session.startedAtMs = observedAtMs;
  if (session.lastValidAtMs !== null) {
    const gap = observedAtMs - session.lastValidAtMs;
    if (gap >= 0 && gap <= maxContinuousGapMs) session.activeMs += gap;
  }
  session.lastValidAtMs = observedAtMs;
  if (displayedAccuracy !== null) {
    session.accuracyTotal += Math.max(0, Math.min(100, displayedAccuracy));
    session.accuracySampleCount += 1;
  }
}

export function setSessionRepetitions(session: ExerciseSessionAccumulator, repetitions: number): void {
  session.repetitions = Math.max(session.repetitions, repetitions);
}

export function sessionNeedsAutosave(session: ExerciseSessionAccumulator): boolean {
  if (session.repetitions < 1 || session.accuracySampleCount < 1) return false;
  return session.repetitions > session.lastQueuedRepetitions
    || session.activeMs - session.lastQueuedActiveMs >= SESSION_AUTOSAVE_INTERVAL_MS;
}

export function nextSessionSnapshot(session: ExerciseSessionAccumulator): ExerciseSessionSummary | null {
  if (
    session.repetitions < 1
    || session.accuracySampleCount < 1
    || session.startedAtMs === null
    || session.lastValidAtMs === null
  ) return null;
  session.revision += 1;
  session.lastQueuedActiveMs = session.activeMs;
  session.lastQueuedRepetitions = session.repetitions;
  return {
    session_id: session.sessionId,
    exercise_id: session.exerciseId,
    started_at: new Date(session.startedAtMs).toISOString(),
    last_active_at: new Date(session.lastValidAtMs).toISOString(),
    active_seconds: Math.floor(session.activeMs / 1000),
    repetitions: session.repetitions,
    average_accuracy: Math.round((session.accuracyTotal / session.accuracySampleCount) * 100) / 100,
    accuracy_sample_count: session.accuracySampleCount,
    revision: session.revision,
  };
}

type SaveSession = (snapshot: ExerciseSessionSummary, keepalive: boolean) => Promise<ExerciseSessionSummary>;

export class LatestSessionSaveQueue {
  private pending: ExerciseSessionSummary | null = null;
  private inFlight = false;
  private retryTimer: number | null = null;
  private failureCount = 0;
  private disposed = false;

  constructor(
    private readonly save: SaveSession,
    private readonly onPersistentError: (error: Error | null) => void,
  ) {}

  enqueue(snapshot: ExerciseSessionSummary): void {
    if (this.disposed) return;
    if (!this.pending || snapshot.revision > this.pending.revision) this.pending = snapshot;
    if (this.retryTimer === null) void this.drain();
  }

  flushKeepalive(snapshot: ExerciseSessionSummary): void {
    void this.save(snapshot, true).catch((error: unknown) => {
      if (!this.disposed) this.onPersistentError(error instanceof Error ? error : new Error("Unable to save progress"));
    });
  }

  dispose(): void {
    this.disposed = true;
    if (this.retryTimer !== null) window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.pending = null;
  }

  private async drain(): Promise<void> {
    if (this.disposed || this.inFlight || !this.pending) return;
    const snapshot = this.pending;
    this.pending = null;
    this.inFlight = true;
    try {
      await this.save(snapshot, false);
      this.failureCount = 0;
      if (!this.disposed) this.onPersistentError(null);
    } catch (error) {
      this.restoreFailedSnapshot(snapshot);
      this.failureCount += 1;
      if (!this.disposed && this.failureCount >= MAX_SAVE_RETRIES) {
        this.onPersistentError(error instanceof Error ? error : new Error("Unable to save progress"));
      }
      if (!this.disposed) {
        const delay = Math.min(5_000, 750 * this.failureCount);
        this.retryTimer = window.setTimeout(() => {
          this.retryTimer = null;
          void this.drain();
        }, delay);
      }
    } finally {
      this.inFlight = false;
      if (!this.disposed && this.pending && this.retryTimer === null) void this.drain();
    }
  }

  private restoreFailedSnapshot(snapshot: ExerciseSessionSummary): void {
    if (!this.pending || snapshot.revision > this.pending.revision) this.pending = snapshot;
  }
}
