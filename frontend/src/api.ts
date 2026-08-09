import type { ClassifierPrediction, PoseWorldLandmark, Profile, User } from "./types";

let csrfToken = "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes((init.method ?? "GET").toUpperCase()) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg ?? "Invalid request").join("; ")
      : typeof detail === "string" ? detail : "Something went wrong";
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function refreshCsrf(): Promise<string> {
  const result = await request<{ csrf_token: string }>("/api/auth/csrf");
  csrfToken = result.csrf_token;
  return csrfToken;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<{ user: User; csrf_token: string }> {
  const result = await request<{ user: User; csrf_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  csrfToken = result.csrf_token;
  return result;
}

export async function login(payload: { email: string; password: string }): Promise<{ user: User; csrf_token: string }> {
  const result = await request<{ user: User; csrf_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  csrfToken = result.csrf_token;
  return result;
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
  csrfToken = "";
}

export const getMe = () => request<User>("/api/auth/me");
export const getProfile = () => request<Profile>("/api/profile");

export async function updateProfile(payload: Omit<Profile, "user_id" | "name" | "email" | "image_url">): Promise<Profile> {
  return request<Profile>("/api/profile", { method: "PUT", body: JSON.stringify(payload) });
}

export async function uploadProfileImage(file: File): Promise<Profile> {
  const form = new FormData();
  form.append("image", file);
  return request<Profile>("/api/profile/image", { method: "POST", body: form });
}

export async function deleteProfileImage(): Promise<Profile> {
  return request<Profile>("/api/profile/image", { method: "DELETE" });
}

export function predictClassifier(
  modelId: string,
  worldLandmarks: PoseWorldLandmark[],
  signal?: AbortSignal,
): Promise<ClassifierPrediction> {
  return request<ClassifierPrediction>(`/api/classifiers/${encodeURIComponent(modelId)}/predict`, {
    method: "POST",
    body: JSON.stringify({ world_landmarks: worldLandmarks }),
    signal,
  });
}
