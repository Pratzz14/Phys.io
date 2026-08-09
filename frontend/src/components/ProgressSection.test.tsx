import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExerciseSessionSummary } from "../types";
import { ProgressSection } from "./ProgressSection";

function recentSession(exerciseId: ExerciseSessionSummary["exercise_id"]): ExerciseSessionSummary {
  const endedAt = new Date();
  endedAt.setHours(endedAt.getHours() - 1);
  return {
    session_id: "44444444-4444-4444-8444-444444444444",
    exercise_id: exerciseId,
    started_at: new Date(endedAt.getTime() - 120_000).toISOString(),
    last_active_at: endedAt.toISOString(),
    active_seconds: 90,
    repetitions: 5,
    average_accuracy: 88,
    accuracy_sample_count: 20,
    revision: 1,
  };
}

test("switches progress metrics and exercise filters", async () => {
  const user = userEvent.setup();
  render(<ProgressSection sessions={[recentSession("hands-up-down")]} loading={false} error="" onRetry={vi.fn()} />);
  expect(screen.getByRole("img", { name: /repetitions over 12 weeks/i })).toBeInTheDocument();
  expect(screen.getByText("Repetitions", { selector: "small" }).nextElementSibling).toHaveTextContent("5");

  await user.click(screen.getByRole("button", { name: "Accuracy" }));
  expect(screen.getByRole("img", { name: /accuracy over 12 weeks/i })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Exercise"), "hands-side-up");
  expect(screen.getByText("Complete your first live session to see progress.")).toBeInTheDocument();
});

test("keeps progress loading and retry failures inside the section", async () => {
  const retry = vi.fn();
  const { rerender } = render(<ProgressSection sessions={[]} loading error="" onRetry={retry} />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading exercise progress");
  rerender(<ProgressSection sessions={[]} loading={false} error="offline" onRetry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not load");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
