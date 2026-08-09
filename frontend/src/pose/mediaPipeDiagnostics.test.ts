import workerSource from "./pose.worker.ts?raw";
import {
  installMediaPipeConsoleFilter,
  isKnownMediaPipeDiagnostic,
  KNOWN_MEDIAPIPE_DIAGNOSTICS,
} from "./mediaPipeDiagnostics";

test("keeps the classic worker free of module imports", () => {
  expect(workerSource).not.toMatch(/^\s*import\s/m);
  for (const diagnostic of KNOWN_MEDIAPIPE_DIAGNOSTICS) {
    expect(workerSource).toContain(diagnostic);
  }
});

test("recognizes only the known successful MediaPipe diagnostics", () => {
  expect(isKnownMediaPipeDiagnostic(["INFO: Created TensorFlow Lite XNNPACK delegate for CPU."])).toBe(true);
  expect(isKnownMediaPipeDiagnostic(["inference_feedback_manager.cc:121] Feedback manager requires a model with a single signature inference."])).toBe(true);
  expect(isKnownMediaPipeDiagnostic(["landmark_projection_calculator.cc:81] Using NORM_RECT without IMAGE_DIMENSIONS"])).toBe(true);
  expect(isKnownMediaPipeDiagnostic(["Pose model failed to load"])).toBe(false);
});

test("suppresses known diagnostics and forwards real failures", () => {
  const error = vi.fn();
  const warn = vi.fn();
  const target = { error, warn };
  const restore = installMediaPipeConsoleFilter(target);

  target.error("INFO: Created TensorFlow Lite XNNPACK delegate for CPU.");
  target.warn("Feedback manager requires a model with a single signature inference.");
  target.error("Pose model failed to load");
  target.warn("Unexpected inference warning");

  expect(error).toHaveBeenCalledOnce();
  expect(error).toHaveBeenCalledWith("Pose model failed to load");
  expect(warn).toHaveBeenCalledOnce();
  expect(warn).toHaveBeenCalledWith("Unexpected inference warning");

  restore();
  expect(target.error).toBe(error);
  expect(target.warn).toBe(warn);
});
