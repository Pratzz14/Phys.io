import { PAIN_MAX, painAreas, painPercent } from "./data/painAreas";
import { greetingForHour } from "./utils/timeGreeting";

test("uses a time-appropriate greeting", () => {
  expect(greetingForHour(0)).toBe("Good morning");
  expect(greetingForHour(11)).toBe("Good morning");
  expect(greetingForHour(12)).toBe("Good afternoon");
  expect(greetingForHour(16)).toBe("Good afternoon");
  expect(greetingForHour(17)).toBe("Good evening");
  expect(greetingForHour(23)).toBe("Good evening");
});

test("keeps every profile pain area in the shared dashboard configuration", () => {
  expect(painAreas.map(({ key }) => key)).toEqual([
    "neck_pain",
    "shoulder_pain",
    "elbow_pain",
    "back_pain",
    "knee_pain",
    "ankle_pain",
  ]);
});

test("maps pain values to their true visual endpoints", () => {
  expect(painPercent(0)).toBe(0);
  expect(painPercent(PAIN_MAX / 2)).toBe(50);
  expect(painPercent(PAIN_MAX)).toBe(100);
});
