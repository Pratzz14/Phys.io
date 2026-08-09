import type { PoseLandmark } from "../types";
import { MEDIAPIPE_POSE_CONNECTIONS } from "./connections";

const MIN_VISIBILITY = 0.5;

function visible(landmark: PoseLandmark | undefined): landmark is PoseLandmark {
  return Boolean(
    landmark &&
    (landmark.visibility ?? 0) >= MIN_VISIBILITY &&
    (landmark.presence ?? 0) >= MIN_VISIBILITY,
  );
}

export function syncCanvasToVideo(
  canvas: HTMLCanvasElement,
  video: Pick<HTMLVideoElement, "videoWidth" | "videoHeight">,
): boolean {
  if (!video.videoWidth || !video.videoHeight) return false;
  if (canvas.width === video.videoWidth && canvas.height === video.videoHeight) return false;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  return true;
}

export function clearPose(canvas: HTMLCanvasElement): void {
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPose(canvas: HTMLCanvasElement, landmarks: PoseLandmark[]): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks.length) return;

  const point = (landmark: PoseLandmark) => ({
    x: landmark.x * canvas.width,
    y: landmark.y * canvas.height,
  });
  const scale = Math.max(1, Math.min(canvas.width, canvas.height) / 540);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(85, 216, 194, .92)";
  context.lineWidth = 3 * scale;
  context.shadowColor = "rgba(85, 216, 194, .28)";
  context.shadowBlur = 8 * scale;
  for (const [start, end] of MEDIAPIPE_POSE_CONNECTIONS) {
    if (!visible(landmarks[start]) || !visible(landmarks[end])) continue;
    const first = point(landmarks[start]);
    const second = point(landmarks[end]);
    context.beginPath();
    context.moveTo(first.x, first.y);
    context.lineTo(second.x, second.y);
    context.stroke();
  }

  context.shadowBlur = 5 * scale;
  for (const landmark of landmarks) {
    if (!visible(landmark)) continue;
    const current = point(landmark);
    context.beginPath();
    context.arc(current.x, current.y, 4 * scale, 0, Math.PI * 2);
    context.fillStyle = "#55d8c2";
    context.fill();
    context.lineWidth = 1.4 * scale;
    context.strokeStyle = "#e9fffa";
    context.stroke();
  }
  context.restore();
}
