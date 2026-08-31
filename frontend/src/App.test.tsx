import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./auth/AuthProvider";
import { App } from "./App";
import { Router } from "./router";
import { ExercisesPage } from "./pages/ExercisesPage";
import { ExercisePage } from "./pages/ExercisePage";
import { advanceRepetition, nextPositionFor, predictionGuidance } from "./components/ExerciseMonitor";
import { exercises } from "./data/exercises";

vi.mock("./api", () => ({
  refreshCsrf: vi.fn().mockResolvedValue("csrf"),
  getMe: vi.fn().mockRejectedValue(new Error("not authenticated")),
  predictClassifier: vi.fn(),
  saveExerciseSession: vi.fn(),
}));

vi.mock("./pose/usePoseCamera", () => ({
  usePoseCamera: () => ({ status: "running", error: null, start: vi.fn(), stop: vi.fn() }),
}));

test("renders the login surface for an unauthenticated visitor", async () => {
  window.history.pushState({}, "", "/login");
  render(<Router><AuthProvider><App /></AuthProvider></Router>);
  expect(await screen.findByRole("heading", { name: /move with confidence/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
});

test("labels unsupported classifiers as guidance only", () => {
  window.history.pushState({}, "", "/exercises");
  render(<Router><ExercisesPage /></Router>);
  expect(screen.getAllByText("Guidance only").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Live monitoring").length).toBe(2);
});

test("maps each classifier position to the next target", () => {
  expect(nextPositionFor("Up")).toBe("Down");
  expect(nextPositionFor("Down")).toBe("Up");
  expect(nextPositionFor("Side", ["Side", "Up"])).toBe("Up");
  expect(nextPositionFor("Up", ["Side", "Up"])).toBe("Side");
  expect(nextPositionFor("Waiting")).toBe("-");
});

test("explains why a camera-ready pose cannot be classified", () => {
  expect(predictionGuidance(false, 0)).toBe("Show shoulders & hips");
  expect(predictionGuidance(false, 0.45)).toBe("Keep full body visible");
  expect(predictionGuidance(true, 1)).toBeNull();
});

test("counts only a complete return to the starting endpoint", () => {
  const empty = { start: null, current: null, transitions: 0, repetitions: 0, target: "-" };
  const down = advanceRepetition(empty, "Down", ["Up", "Down"]);
  const up = advanceRepetition(down, "Up", ["Up", "Down"]);
  const completed = advanceRepetition(up, "Down", ["Up", "Down"]);
  expect(down.target).toBe("Up");
  expect(up.repetitions).toBe(0);
  expect(completed.repetitions).toBe(1);
});

test("keeps live monitoring focused on progress and removes the setup aside", () => {
  window.history.pushState({}, "", "/exercise/hands-up-down");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByText("Current position")).toBeInTheDocument();
  expect(screen.getByText("Next position")).toBeInTheDocument();
  expect(screen.getByText("Accuracy")).toBeInTheDocument();
  expect(screen.getByText("Repetitions")).toBeInTheDocument();
  const camera = screen.getByLabelText(/live exercise camera view/i);
  const metadata = screen.getByRole("complementary", { name: /live exercise metadata/i });
  expect(camera.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(metadata).getByRole("heading", { name: /hands up \/ hands down/i })).toBeInTheDocument();
  expect(within(metadata).getByRole("link", { name: /back to exercises/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /shoulder practice/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /before you begin/i })).not.toBeInTheDocument();
});

test("keeps legacy live exercise URLs as aliases", () => {
  window.history.pushState({}, "", "/exercise/back-toe-touch");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByRole("heading", { name: /hands side \/ hands up/i })).toBeInTheDocument();
});

test("keeps setup guidance for guidance-only exercises", () => {
  window.history.pushState({}, "", "/exercise/neck-release");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByRole("heading", { name: /before you begin/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /play guided video/i })).toBeInTheDocument();
  expect(screen.queryByTitle(/guided exercise video/i)).not.toBeInTheDocument();
});

test("loads a privacy-enhanced guided video only after activation", async () => {
  const user = userEvent.setup();
  window.history.pushState({}, "", "/exercise/neck-release");
  render(<Router><ExercisePage /></Router>);

  await user.click(screen.getByRole("button", { name: /play guided video/i }));

  const frame = screen.getByTitle("Neck release guided exercise video");
  expect(frame).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/iwPsbH5yFc4?autoplay=1&rel=0");
  expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  expect(screen.getByRole("link", { name: /open on youtube/i })).toHaveAttribute("href", "https://www.youtube.com/watch?v=iwPsbH5yFc4");
});

test("provides distinct guidance for every guidance-only exercise", () => {
  const guided = exercises.filter((exercise) => exercise.mode === "guidance");
  expect(guided.every((exercise) => exercise.guidance)).toBe(true);
  expect(guided.every((exercise) => exercise.youtubeVideoId)).toBe(true);
  expect(new Set(guided.map((exercise) => exercise.guidance?.intro)).size).toBe(guided.length);

  window.history.pushState({}, "", "/exercise/knee-control");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByText("Lower with control")).toBeInTheDocument();
  expect(screen.queryByText("Tilt to one side")).not.toBeInTheDocument();
});
