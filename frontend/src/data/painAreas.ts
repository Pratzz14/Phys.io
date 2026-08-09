import type { Profile } from "../types";

export type PainKey = Extract<keyof Profile, `${string}_pain`>;

interface PainArea {
  key: PainKey;
  label: string;
}

export const PAIN_MAX = 50;

export const painAreas = [
  { key: "neck_pain", label: "Neck" },
  { key: "shoulder_pain", label: "Shoulder" },
  { key: "elbow_pain", label: "Elbow" },
  { key: "back_pain", label: "Lower back" },
  { key: "knee_pain", label: "Knee" },
  { key: "ankle_pain", label: "Ankle" },
] as const satisfies readonly PainArea[];

export function painPercent(value: number): number {
  return Math.min(100, Math.max(0, (value / PAIN_MAX) * 100));
}
