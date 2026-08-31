export type Gender = "male" | "female" | "other" | "unspecified";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Profile {
  user_id: string;
  name: string;
  email: string;
  fullname: string;
  phone: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  specify: string;
  neck_pain: number;
  shoulder_pain: number;
  elbow_pain: number;
  back_pain: number;
  knee_pain: number;
  ankle_pain: number;
  image_url: string | null;
}

export type PoseVariant = "standing" | "shoulder" | "back" | "neck" | "elbow" | "knee" | "ankle";

export interface GuidanceFrame {
  pose: PoseVariant;
  mirrored?: boolean;
}

export interface GuidanceStep {
  title: string;
  description: string;
}

export interface ExerciseGuidance {
  intro: string;
  frames: GuidanceFrame[];
  steps: GuidanceStep[];
  checklist: string[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  area: string;
  accent: string;
  mode: "live" | "guidance";
  classifier?: ExerciseClassifier;
  youtubeVideoId?: string;
  guidance?: ExerciseGuidance;
}

export interface ClassifierEndpoint {
  classLabel: string;
  displayLabel: string;
}

export interface ExerciseClassifier {
  modelId: "hands-up-vs-down.joblib" | "hands-side-vs-up.joblib";
  endpoints: readonly [ClassifierEndpoint, ClassifierEndpoint];
}

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export interface PoseWorldLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
}

export interface PoseFrameResult {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseWorldLandmark[];
  timestampMs: number;
}

export interface ClassifierPrediction {
  modelId: string;
  classes: string[];
  valid: boolean;
  featureCoverage: number;
  label: string | null;
  confidence: number | null;
  probabilities: Record<string, number>;
}

export interface MonitorState {
  status: "idle" | "loading" | "ready" | "running" | "error";
  message?: string;
  label: string;
  target: string;
  repetitions: number;
  accuracy: number;
}

export type LiveExerciseId = "hands-up-down" | "hands-side-up";

export interface ExerciseSessionUpdate {
  exercise_id: LiveExerciseId;
  started_at: string;
  last_active_at: string;
  active_seconds: number;
  repetitions: number;
  average_accuracy: number;
  accuracy_sample_count: number;
  revision: number;
}

export interface ExerciseSessionSummary extends ExerciseSessionUpdate {
  session_id: string;
}
