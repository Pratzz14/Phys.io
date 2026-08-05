import { render, screen } from "@testing-library/react";
import { AuthProvider } from "./auth/AuthProvider";
import { App } from "./App";
import { Router } from "./router";
import { ExercisesPage } from "./pages/ExercisesPage";

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
