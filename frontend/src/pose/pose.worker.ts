/// <reference lib="webworker" />

interface InitRequest {
  type: "init";
  modelUrl: string;
  runtimeBaseUrl: string;
  visionBundleUrl: string;
}

interface DetectRequest {
  type: "detect";
  frame: ImageBitmap;
  timestampMs: number;
}

type WorkerRequest = InitRequest | DetectRequest | { type: "dispose" };

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
}

interface PoseLandmarkerInstance {
  detectForVideo(frame: ImageBitmap, timestampMs: number): {
    landmarks: Array<Array<Partial<Landmark> & Pick<Landmark, "x" | "y" | "z">>>;
    worldLandmarks: Array<Array<Partial<Landmark> & Pick<Landmark, "x" | "y" | "z">>>;
  };
  close(): void;
}

interface VisionRuntime {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  PoseLandmarker: {
    createFromOptions(vision: unknown, options: {
      baseOptions: { modelAssetPath: string };
      runningMode: "VIDEO";
      numPoses: number;
      minPoseDetectionConfidence: number;
      minPosePresenceConfidence: number;
      minTrackingConfidence: number;
      outputSegmentationMasks: boolean;
    }): Promise<PoseLandmarkerInstance>;
  };
}

interface VisionWorkerScope extends DedicatedWorkerGlobalScope {
  Vision?: VisionRuntime;
}

const workerScope = self as VisionWorkerScope;
let poseLandmarker: PoseLandmarkerInstance | null = null;

// This worker must remain import-free because MediaPipe's self-hosted runtime is
// loaded with importScripts(), which is only available to classic workers.
const knownMediaPipeDiagnostics = [
  "OpenGL error checking is disabled",
  "Created TensorFlow Lite XNNPACK delegate for CPU",
  "Feedback manager requires a model with a single signature inference",
  "Using NORM_RECT without IMAGE_DIMENSIONS",
] as const;

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);
const isKnownMediaPipeDiagnostic = (args: unknown[]) => {
  const message = args.map(String).join(" ");
  return knownMediaPipeDiagnostics.some((diagnostic) => message.includes(diagnostic));
};

console.error = (...args: unknown[]) => {
  if (!isKnownMediaPipeDiagnostic(args)) originalConsoleError(...args);
};
console.warn = (...args: unknown[]) => {
  if (!isKnownMediaPipeDiagnostic(args)) originalConsoleWarn(...args);
};

function normalizeLandmarks(values: Array<Partial<Landmark> & Pick<Landmark, "x" | "y" | "z">> | undefined): Landmark[] {
  return (values ?? []).map((landmark) => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility ?? 0,
    presence: landmark.presence ?? landmark.visibility ?? 0,
  }));
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === "init") {
    try {
      importScripts(message.visionBundleUrl);
      if (!workerScope.Vision) throw new Error("MediaPipe vision runtime did not initialize.");
      const vision = await workerScope.Vision.FilesetResolver.forVisionTasks(message.runtimeBaseUrl);
      poseLandmarker = await workerScope.Vision.PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: message.modelUrl },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
      workerScope.postMessage({ type: "ready" });
    } catch (error) {
      workerScope.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (message.type === "detect") {
    if (!poseLandmarker) {
      message.frame.close();
      workerScope.postMessage({ type: "error", message: "Pose Landmarker is not ready." });
      return;
    }
    try {
      const result = poseLandmarker.detectForVideo(message.frame, message.timestampMs);
      workerScope.postMessage({
        type: "result",
        landmarks: normalizeLandmarks(result.landmarks[0]),
        worldLandmarks: normalizeLandmarks(result.worldLandmarks[0]),
        timestampMs: message.timestampMs,
      });
    } catch (error) {
      workerScope.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      message.frame.close();
    }
    return;
  }

  poseLandmarker?.close();
  poseLandmarker = null;
  workerScope.postMessage({ type: "disposed" });
  workerScope.close();
};
