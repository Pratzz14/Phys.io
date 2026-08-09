import { fireEvent, render, screen, within } from "@testing-library/react";
import { Router } from "../router";
import { ProfilePage } from "./ProfilePage";

vi.mock("../api", () => ({
  getProfile: vi.fn().mockResolvedValue({
    user_id: "user-1",
    name: "Pratik",
    email: "pratik@example.com",
    fullname: "Pratik",
    phone: "",
    age: 25,
    weight: 0,
    height: 0,
    gender: "unspecified",
    specify: "",
    neck_pain: 10,
    shoulder_pain: 0,
    elbow_pain: 0,
    back_pain: 18,
    knee_pain: 0,
    ankle_pain: 0,
    image_url: null,
  }),
  updateProfile: vi.fn(),
  uploadProfileImage: vi.fn(),
  deleteProfileImage: vi.fn(),
}));

test("updates the visible pain value while its slider moves", async () => {
  render(<Router><ProfilePage /></Router>);
  const slider = await screen.findByRole("slider", { name: "Neck" });
  const field = slider.closest("label");
  expect(field).not.toBeNull();

  fireEvent.input(slider, { target: { value: "11" } });

  expect(within(field!).getByRole("status")).toHaveTextContent("11");
});
