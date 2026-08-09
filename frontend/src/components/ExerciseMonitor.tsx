import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { predictClassifier } from "../api";
import { usePoseCamera } from "../pose/usePoseCamera";
import type { Exercise, MonitorState, PoseFrameResult } from "../types";

const PREDICTION_INTERVAL_MS = 200;
const STABLE_POSITION_MS = 500;
const STALE_POSITION_MS = 750;
const MIN_CONFIDENCE = 0.65;
const HISTORY_SIZE = 8;

interface MotionProgress {
  start: string | null;
  current: string | null;
  transitions: number;
  repetitions: number;
  target: string;
}

export function nextPositionFor(label: string, endpoints: readonly string[] = ["Up", "Down"]): string {
  if (label === endpoints[0]) return endpoints[1] ?? "-";
  if (label === endpoints[1]) return endpoints[0] ?? "-";
  return "-";
}

export function advanceRepetition(
  progress: MotionProgress,
  position: string,
  endpoints: readonly [string, string],
): MotionProgress {
  if (!endpoints.includes(position)) return progress;
  if (!progress.start) {
    return { start: position, current: position, transitions: 0, repetitions: progress.repetitions, target: nextPositionFor(position, endpoints) };
  }
  if (progress.current === position) return progress;
  const transitions = progress.transitions + 1;
  const completed = position === progress.start && transitions >= 2;
  return {
    start: progress.start,
    current: position,
    transitions: completed ? 0 : transitions,
    repetitions: progress.repetitions + (completed ? 1 : 0),
    target: nextPositionFor(position, endpoints),
  };
}

export function smoothProbabilities(history: Array<Record<string, number>>, classes: readonly string[]): Record<string, number> {
  if (!history.length) return {};
  return Object.fromEntries(classes.map((label) => [
    label,
    history.reduce((sum, item) => sum + (item[label] ?? 0), 0) / history.length,
  ]));
}

export function predictionGuidance(valid: boolean, featureCoverage: number): string | null {
  if (valid) return null;
  return featureCoverage <= 0 ? "Show shoulders & hips" : "Keep full body visible";
}

function statusLabel(status: MonitorState["status"]): string {
  if (status === "loading") return "Preparing camera";
  if (status === "ready") return "Camera ready";
  if (status === "running") return "Live";
  if (status === "error") return "Camera unavailable";
  return "Waiting";
}

function currentPosition(state: MonitorState): string {
  return state.status === "running" || state.status === "ready" ? state.label : statusLabel(state.status);
}

const initialState = (): MonitorState => ({
  status: "idle",
  label: "Waiting",
  target: "-",
  repetitions: 0,
  accuracy: 0,
});

export function ExerciseMonitor({ exercise, children }: { exercise: Exercise; children?: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<MonitorState>(initialState);
  const classifier = exercise.classifier;
  const lastRequestRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const staleTimerRef = useRef<number | null>(null);
  const historyRef = useRef<Array<Record<string, number>>>([]);
  const candidateRef = useRef<{ label: string; since: number } | null>(null);
  const confirmedRef = useRef<string | null>(null);
  const progressRef = useRef<MotionProgress>({ start: null, current: null, transitions: 0, repetitions: 0, target: "-" });

  const classLabels = useMemo(() => classifier?.endpoints.map((endpoint) => endpoint.classLabel) ?? [], [classifier]);
  const displayLabels = useMemo(() => classifier?.endpoints.map((endpoint) => endpoint.displayLabel) as [string, string] | undefined, [classifier]);
  const displayForClass = useMemo(() => new Map(classifier?.endpoints.map((endpoint) => [endpoint.classLabel, endpoint.displayLabel]) ?? []), [classifier]);

  const clearPrediction = useCallback(() => {
    historyRef.current = [];
    candidateRef.current = null;
    confirmedRef.current = null;
    setState((current) => current.status === "error" ? current : {
      ...current,
      status: "ready",
      label: "Camera ready",
      target: "-",
      accuracy: 0,
      message: undefined,
    });
  }, []);

  const showReadyLabel = useCallback((label: string) => {
    setState((current) => {
      if (current.status === "error") return current;
      if (current.status === "ready" && current.label === label && current.target === "-" && current.accuracy === 0) return current;
      return { ...current, status: "ready", label, target: "-", accuracy: 0, message: undefined };
    });
  }, []);

  const refreshStaleTimer = useCallback(() => {
    if (staleTimerRef.current !== null) window.clearTimeout(staleTimerRef.current);
    staleTimerRef.current = window.setTimeout(clearPrediction, STALE_POSITION_MS);
  }, [clearPrediction]);

  const handlePoseResult = useCallback((result: PoseFrameResult) => {
    if (!classifier || !displayLabels) return;
    if (result.worldLandmarks.length !== 33) {
      historyRef.current = [];
      candidateRef.current = null;
      confirmedRef.current = null;
      showReadyLabel("Step into camera view");
      refreshStaleTimer();
      return;
    }
    const now = performance.now();
    if (requestInFlightRef.current || now - lastRequestRef.current < PREDICTION_INTERVAL_MS) return;
    lastRequestRef.current = now;
    requestInFlightRef.current = true;
    const controller = new AbortController();
    requestAbortRef.current = controller;

    void predictClassifier(classifier.modelId, result.worldLandmarks, controller.signal)
      .then((prediction) => {
        if (!prediction.valid) {
          historyRef.current = [];
          candidateRef.current = null;
          confirmedRef.current = null;
          showReadyLabel(predictionGuidance(prediction.valid, prediction.featureCoverage) ?? "Keep full body visible");
          refreshStaleTimer();
          return;
        }
        historyRef.current = [...historyRef.current.slice(-(HISTORY_SIZE - 1)), prediction.probabilities];
        const smoothed = smoothProbabilities(historyRef.current, classLabels);
        const winningClass = classLabels.reduce((winner, candidate) =>
          (smoothed[candidate] ?? 0) > (smoothed[winner] ?? 0) ? candidate : winner,
        classLabels[0]);
        const confidence = smoothed[winningClass] ?? 0;
        if (!winningClass || confidence < MIN_CONFIDENCE) {
          candidateRef.current = null;
          showReadyLabel("Hold an endpoint pose");
          refreshStaleTimer();
          return;
        }

        const displayLabel = displayForClass.get(winningClass);
        if (!displayLabel) {
          refreshStaleTimer();
          return;
        }
        const observedAt = performance.now();
        if (candidateRef.current?.label !== displayLabel) {
          candidateRef.current = { label: displayLabel, since: observedAt };
          showReadyLabel(`Hold ${displayLabel} steady`);
        } else if (observedAt - candidateRef.current.since >= STABLE_POSITION_MS) {
          if (confirmedRef.current !== displayLabel) {
            confirmedRef.current = displayLabel;
            progressRef.current = advanceRepetition(progressRef.current, displayLabel, displayLabels);
          }
          setState({
            status: "running",
            label: displayLabel,
            target: progressRef.current.target,
            repetitions: progressRef.current.repetitions,
            accuracy: Math.round(confidence * 100),
          });
        }

        refreshStaleTimer();
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState((current) => ({ ...current, status: "error", message: error instanceof Error ? error.message : "Prediction failed" }));
      })
      .finally(() => {
        if (requestAbortRef.current === controller) {
          requestAbortRef.current = null;
          requestInFlightRef.current = false;
        }
      });
  }, [classLabels, classifier, displayForClass, displayLabels, refreshStaleTimer, showReadyLabel]);

  const camera = usePoseCamera({ videoRef, canvasRef, onPoseResult: handlePoseResult });

  useEffect(() => {
    setState({ ...initialState(), status: "loading", label: "Loading camera and model..." });
    progressRef.current = { start: null, current: null, transitions: 0, repetitions: 0, target: "-" };
    historyRef.current = [];
    candidateRef.current = null;
    confirmedRef.current = null;
    void camera.start();
    return () => camera.stop();
    // Camera start/stop is intentionally tied to the exercise identity only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  useEffect(() => {
    if (camera.status === "requesting-camera" || camera.status === "loading-model") {
      setState((current) => ({ ...current, status: "loading", message: undefined }));
    } else if (camera.status === "running") {
      setState((current) => current.status === "running" ? current : { ...current, status: "ready", label: "Camera ready", message: undefined });
    } else if (camera.status === "error") {
      setState((current) => ({ ...current, status: "error", label: "Camera unavailable", message: camera.error?.message }));
    }
  }, [camera.error, camera.status]);

  useEffect(() => () => {
    requestAbortRef.current?.abort();
    if (staleTimerRef.current !== null) window.clearTimeout(staleTimerRef.current);
  }, []);

  return (
    <div className="monitor-workspace">
      <div className="monitor-wrap">
        <div className="monitor-canvas" aria-label="Live exercise camera view">
          <video ref={videoRef} muted playsInline aria-hidden="true" />
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>
      </div>
      <aside className="monitor-panel" aria-label="Live exercise metadata">
        {children}
        {state.message && <p className="monitor-error">{state.message}</p>}
        <div className="monitor-panel-header">
          <span className="camera-ready"><span className="status-dot ready" /> Private local session</span>
          <span className="monitor-live-state" aria-live="polite"><span className={`status-dot ${state.status}`} /> {statusLabel(state.status)}</span>
        </div>
        <div className="monitor-summary" aria-label="Exercise progress">
          <div className="monitor-metric monitor-metric-current"><span className="monitor-metric-label">Current position</span><strong>{currentPosition(state)}</strong></div>
          <div className="monitor-metric monitor-metric-next"><span className="monitor-metric-label">Next position</span><strong>{state.status === "running" ? state.target : "-"}</strong></div>
          <div className="monitor-metric monitor-metric-accuracy"><span className="monitor-metric-label">Accuracy</span><strong>{state.status === "running" ? `${state.accuracy}%` : "-"}</strong></div>
          <div className="monitor-metric monitor-metric-repetitions"><span className="monitor-metric-label">Repetitions</span><strong>{state.repetitions}</strong></div>
        </div>
      </aside>
    </div>
  );
}
