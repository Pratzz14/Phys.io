import { render, screen, within } from "@testing-library/react";
import { AuthProvider } from "./auth/AuthProvider";
import { App } from "./App";
import { Router } from "./router";
import { ExercisesPage } from "./pages/ExercisesPage";
import { ExercisePage } from "./pages/ExercisePage";
import { nextPositionFor } from "./components/ExerciseMonitor";

vi.mock("./api", () => ({
  refreshCsrf: vi.fn().mockResolvedValue("csrf"),
  getMe: vi.fn().mockRejectedValue(new Error("not authenticated")),
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
  expect(nextPositionFor("To sky")).toBe("Toe touch");
  expect(nextPositionFor("Toe touch")).toBe("To sky");
  expect(nextPositionFor("Waiting")).toBe("-");
});

test("keeps live monitoring focused on progress and removes the setup aside", () => {
  window.history.pushState({}, "", "/exercise/shoulder-mobility");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByText("Current position")).toBeInTheDocument();
  expect(screen.getByText("Next position")).toBeInTheDocument();
  expect(screen.getByText("Accuracy")).toBeInTheDocument();
  expect(screen.getByText("Repetitions")).toBeInTheDocument();
  const camera = screen.getByLabelText(/live exercise camera view/i);
  const metadata = screen.getByRole("complementary", { name: /live exercise metadata/i });
  expect(camera.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(metadata).getByRole("heading", { name: /shoulder mobility/i })).toBeInTheDocument();
  expect(within(metadata).getByRole("link", { name: /back to exercises/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /shoulder practice/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /before you begin/i })).not.toBeInTheDocument();
});

test("keeps setup guidance for guidance-only exercises", () => {
  window.history.pushState({}, "", "/exercise/neck-release");
  render(<Router><ExercisePage /></Router>);
  expect(screen.getByRole("heading", { name: /before you begin/i })).toBeInTheDocument();
});
