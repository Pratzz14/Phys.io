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

export interface Exercise {
  id: string;
  title: string;
  description: string;
  area: string;
  accent: string;
  mode: "live" | "guidance";
  model?: "shoulder" | "back";
  videoUrl?: string;
}

export interface MonitorState {
  status: "idle" | "loading" | "ready" | "running" | "error";
  message?: string;
  label: string;
  repetitions: number;
  accuracy: number;
}
