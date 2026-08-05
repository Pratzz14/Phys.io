import { useEffect, useRef, useState } from "react";
import type { Exercise, MonitorState } from "../types";

declare global {
  interface Window {
    p5: any;
    ml5: any;
  }
}

const scriptLoads = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const existing = scriptLoads.get(src);
  if (existing) return existing;
  const load = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { scriptLoads.delete(src); reject(new Error(`Could not load ${src}`)); };
    document.head.appendChild(script);
  });
  scriptLoads.set(src, load);
  return load;
}

export function ExerciseMonitor({ exercise }: { exercise: Exercise }) {
  const boothRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MonitorState>({ status: "idle", label: "Waiting", repetitions: 0, accuracy: 0 });

  useEffect(() => {
    let instance: any;
    let stream: MediaStream | undefined;
    let cancelled = false;
    setState({ status: "loading", label: "Loading camera and model…", repetitions: 0, accuracy: 0 });

    const start = async () => {
      try {
        await loadScript("/vendor/p5.min.js");
        await loadScript("/vendor/ml5.min.js");
        if (cancelled || !boothRef.current) return;
        instance = new window.p5((p: any) => {
          let video: any;
          let pose: any;
          let brain: any;
          let poseLabel = "Waiting";
          let oldPose = "";
          let rep = 0;
          let repTicks = 0;
          let cycles = 0;
          let classifyTimer: number | undefined;

          p.setup = () => {
            p.createCanvas(640, 480).parent(boothRef.current);
            video = p.createCapture(p.VIDEO);
            const videoElement = video.elt as HTMLVideoElement | undefined;
            if (videoElement) {
              const source = videoElement.srcObject;
              stream = source && "getTracks" in source ? source as MediaStream : undefined;
              videoElement.addEventListener("loadedmetadata", () => {
                const nextSource = videoElement.srcObject;
                stream = nextSource && "getTracks" in nextSource ? nextSource as MediaStream : undefined;
              }, { once: true });
            }
            video.size(640, 480);
            video.hide();
            window.ml5.poseNet(video, () => setState((current) => ({ ...current, status: "ready", label: "Camera ready" }))).on("pose", (poses: any[]) => {
              if (poses.length) pose = poses[0].pose;
            });
            brain = window.ml5.neuralNetwork({ inputs: 34, outputs: 4, task: "classification", debug: false });
            const base = exercise.model === "back" ? "/models/back/" : "/models/shoulder/";
            brain.load({ model: `${base}model.json`, metadata: `${base}model_meta.json`, weights: `${base}model.weights.bin` }, () => classify());
          };

          const classify = () => {
            if (cancelled) return;
            if (!pose || !brain) { classifyTimer = window.setTimeout(classify, 100); return; }
            const inputs = pose.keypoints.flatMap((keypoint: any) => [keypoint.position.x, keypoint.position.y]);
            brain.classify(inputs, (_error: unknown, results: any[]) => {
              const result = results?.[0];
              if (result?.confidence > 0.75) {
                const nextLabel = exercise.model === "back"
                  ? (result.label.toUpperCase() === "U" ? "To sky" : "Toe touch")
                  : (result.label.toUpperCase() === "U" ? "Up" : "Down");
                const distance = p.dist(pose.leftShoulder.x, pose.leftShoulder.y, pose.leftWrist.x, pose.leftWrist.y);
                const accuracy = exercise.model === "back"
                  ? Math.round(result.confidence * 100)
                  : Math.round(nextLabel === "Up" ? Math.min(100, distance) : Math.min(100, (distance * 100) / 170));
                if (nextLabel !== oldPose) repTicks += 1;
                if (repTicks > 15) {
                  cycles += 1;
                  repTicks = 0;
                  if (cycles > 1 && cycles % 2 === 1) rep += 1;
                  oldPose = nextLabel;
                }
                poseLabel = nextLabel;
                setState({ status: "running", label: poseLabel, repetitions: rep, accuracy });
              }
              classify();
            });
          };

          p.draw = () => {
            if (!video) return;
            p.push();
            p.translate(video.width, 0);
            p.scale(-1, 1);
            p.image(video, 0, 0, video.width, video.height);
            if (pose) {
              p.stroke(255);
              p.strokeWeight(2);
              p.fill(168, 196, 181);
              [pose.rightWrist, pose.leftWrist, pose.rightShoulder, pose.leftShoulder].forEach((point: any) => p.ellipse(point.x, point.y, 20));
              pose.keypoints.forEach((keypoint: any) => p.ellipse(keypoint.position.x, keypoint.position.y, 10));
            }
            p.pop();
            p.noStroke();
            p.fill(245, 243, 238);
            p.textSize(22);
            p.textAlign(p.LEFT, p.TOP);
            p.text(poseLabel, 20, 18);
          };

          p.remove = ((original) => (...args: any[]) => {
            if (classifyTimer) window.clearTimeout(classifyTimer);
            original(...args);
          })(p.remove);
        }, boothRef.current);
      } catch (error) {
        if (!cancelled) setState({ status: "error", label: "Camera unavailable", message: error instanceof Error ? error.message : "Could not start monitoring", repetitions: 0, accuracy: 0 });
      }
    };
    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      instance?.remove?.();
    };
  }, [exercise.model]);

  return (
    <div className="monitor-wrap">
      <div ref={boothRef} className="monitor-canvas" aria-label="Live exercise camera view" />
      <div className="monitor-status"><span className={`status-dot ${state.status}`} /> {state.label}</div>
      {state.status === "running" && <div className="monitor-metrics"><span>{state.repetitions} reps</span><span>{state.accuracy}% confidence</span></div>}
      {state.message && <p className="error-copy">{state.message}</p>}
    </div>
  );
}
