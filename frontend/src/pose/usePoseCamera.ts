import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { PoseFrameResult, PoseLandmark, PoseWorldLandmark } from "../types";
import { clearPose, drawPose, syncCanvasToVideo } from "./drawing";

export type PoseCameraStatus = "idle" | "requesting-camera" | "loading-model" | "running" | "error";

interface PoseCameraError {
  title: string;
  message: string;
}

interface WorkerResponse {
  type: "ready" | "result" | "error" | "disposed";
  message?: string;
  landmarks?: PoseLandmark[];
  worldLandmarks?: PoseWorldLandmark[];
  timestampMs?: number;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPoseResult?: (result: PoseFrameResult) => void;
}

function assetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.href).href;
}

function cameraError(error: unknown): PoseCameraError {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return { title: "Camera permission denied", message: "Allow camera access, then reload and try again." };
    if (error.name === "NotFoundError") return { title: "No camera found", message: "Connect a camera, then reload and try again." };
    if (error.name === "NotReadableError") return { title: "Camera is busy", message: "Close other apps using the camera, then try again." };
  }
  return { title: "Camera unavailable", message: error instanceof Error ? error.message : "Could not start pose tracking." };
}

export function usePoseCamera({ videoRef, canvasRef, onPoseResult }: Options) {
  const [status, setStatus] = useState<PoseCameraStatus>("idle");
  const [error, setError] = useState<PoseCameraError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const runningRef = useRef(false);
  const inFlightRef = useRef(false);
  const frameRequestRef = useRef<number | null>(null);
  const frameRequestKindRef = useRef<"video" | "animation">("video");
  const sessionRef = useRef(0);
  const onPoseResultRef = useRef(onPoseResult);
  onPoseResultRef.current = onPoseResult;

  const release = useCallback(() => {
    runningRef.current = false;
    inFlightRef.current = false;
    const video = videoRef.current;
    if (frameRequestRef.current !== null) {
      if (frameRequestKindRef.current === "video" && video?.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameRequestRef.current);
      } else {
        cancelAnimationFrame(frameRequestRef.current);
      }
      frameRequestRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) {
      worker.postMessage({ type: "dispose" });
      window.setTimeout(() => worker.terminate(), 150);
    }
    if (canvasRef.current) clearPose(canvasRef.current);
  }, [canvasRef, videoRef]);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    release();
    setStatus("idle");
    setError(null);
  }, [release]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    release();
    setError(null);
    setStatus("requesting-camera");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      if (window.isSecureContext === false) throw new Error("Camera access requires HTTPS or localhost.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support camera access.");

      const worker = new Worker(new URL("./pose.worker.ts", import.meta.url), {
        type: "classic",
        name: "physio-pose-landmarker",
      });
      workerRef.current = worker;
      let workerReady = false;
      const ready = new Promise<void>((resolve, reject) => {
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const response = event.data;
          if (response.type === "ready") {
            workerReady = true;
            resolve();
            return;
          }
          if (response.type === "error") {
            inFlightRef.current = false;
            if (!workerReady) reject(new Error(response.message ?? "Pose model failed to load."));
            else if (sessionRef.current === sessionId) {
              setError({ title: "Pose tracking stopped", message: response.message ?? "Restart the camera and try again." });
              setStatus("error");
              release();
            }
            return;
          }
          if (response.type !== "result") return;
          inFlightRef.current = false;
          if (!runningRef.current || sessionRef.current !== sessionId) return;
          const landmarks = response.landmarks ?? [];
          syncCanvasToVideo(canvas, video);
          drawPose(canvas, landmarks);
          onPoseResultRef.current?.({
            landmarks,
            worldLandmarks: response.worldLandmarks ?? [],
            timestampMs: response.timestampMs ?? performance.now(),
          });
        };
        worker.onerror = (event) => {
          const workerFailure = new Error(event.message || "Pose worker failed to start.");
          if (!workerReady) {
            reject(workerFailure);
          } else if (sessionRef.current === sessionId) {
            release();
            setError({ title: "Pose tracking stopped", message: workerFailure.message });
            setStatus("error");
          }
        };
      });

      worker.postMessage({
        type: "init",
        modelUrl: assetUrl("mediapipe/models/pose_landmarker_full.task"),
        runtimeBaseUrl: assetUrl("mediapipe/wasm"),
        visionBundleUrl: assetUrl("mediapipe/vision_bundle.js"),
      });

      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      }).then((stream) => {
        if (sessionRef.current !== sessionId) {
          stream.getTracks().forEach((track) => track.stop());
          throw new DOMException("Camera start cancelled.", "AbortError");
        }
        streamRef.current = stream;
        setStatus("loading-model");
        return stream;
      });
      const [stream] = await Promise.all([streamPromise, ready]);
      if (sessionRef.current !== sessionId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      syncCanvasToVideo(canvas, video);
      runningRef.current = true;
      setStatus("running");
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (sessionRef.current !== sessionId || !runningRef.current) return;
        release();
        setError({ title: "Camera disconnected", message: "Reconnect the camera, then reload and try again." });
        setStatus("error");
      }, { once: true });

      const schedule = () => {
        if (!runningRef.current || sessionRef.current !== sessionId) return;
        const capture = (now: number, metadata?: { mediaTime: number }) => {
          schedule();
          if (inFlightRef.current || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          inFlightRef.current = true;
          void createImageBitmap(video).then((frame) => {
            if (!runningRef.current || workerRef.current !== worker) {
              frame.close();
              inFlightRef.current = false;
              return;
            }
            worker.postMessage({
              type: "detect",
              frame,
              timestampMs: metadata?.mediaTime ? metadata.mediaTime * 1000 : now,
            }, [frame]);
          }).catch(() => { inFlightRef.current = false; });
        };
        if (video.requestVideoFrameCallback) {
          frameRequestKindRef.current = "video";
          frameRequestRef.current = video.requestVideoFrameCallback((now, metadata) => capture(now, metadata));
        } else {
          frameRequestKindRef.current = "animation";
          frameRequestRef.current = requestAnimationFrame((now) => capture(now));
        }
      };
      schedule();
    } catch (caught) {
      if (sessionRef.current !== sessionId) return;
      release();
      setError(cameraError(caught));
      setStatus("error");
    }
  }, [release, videoRef, canvasRef]);

  useEffect(() => () => {
    sessionRef.current += 1;
    release();
  }, [release]);

  return { status, error, start, stop };
}
