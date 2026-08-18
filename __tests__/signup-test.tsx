import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRegister = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

jest.mock("../context/AppContext", () => ({
  useApp: () => ({ register: mockRegister }),
}));

import SignUpScreen from "../app/(auth)/signup";

const pressCreateAccount = async (
  getAllByText: (text: string) => Array<any>,
) => {
  await fireEvent.press(getAllByText("Create Account").at(-1)!);
};

describe("<SignUpScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the account creation form", async () => {
    const { getByText, getByPlaceholderText, getAllByText } =
      await render(<SignUpScreen />);

    expect(getAllByText("Create Account").length).toBe(2);
    getByText("Join TruHub OS — your home command center");
    getByPlaceholderText("First Name");
    getByPlaceholderText("Last Name (Optional)");
    getByPlaceholderText("Email Address");
    getByPlaceholderText("Password");
    getByText(/Already have an account\?/);
  });

  test("blocks submission when required fields are empty", async () => {
    const { getByText, getAllByText } = await render(<SignUpScreen />);
    await pressCreateAccount(getAllByText);

    getByText("Please fill in all required fields.");
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("registers a new user and navigates home on success", async () => {
    mockRegister.mockResolvedValue({ success: true });
    const { getByText, getByPlaceholderText, getAllByText } =
      await render(<SignUpScreen />);

    await fireEvent.changeText(getByPlaceholderText("First Name"), "Demo");
    await fireEvent.changeText(
      getByPlaceholderText("Email Address"),
      "demo@homebase.test",
    );
    await fireEvent.changeText(getByPlaceholderText("Password"), "SuperSecret123!");
    await pressCreateAccount(getAllByText);

    await expect(mockRegister).toHaveBeenCalledWith(
      "demo@homebase.test",
      "SuperSecret123!",
      "Demo",
      "",
    );
    expect(mockReplace).toHaveBeenCalledWith("..");
  });

  test("shows the backend error instead of navigating", async () => {
    mockRegister.mockResolvedValue({
      success: false,
      error: "An account with this email already exists.",
    });
    const { getByText, getByPlaceholderText, getAllByText } =
      await render(<SignUpScreen />);

    await fireEvent.changeText(getByPlaceholderText("First Name"), "Demo");
    await fireEvent.changeText(
      getByPlaceholderText("Email Address"),
      "demo@homebase.test",
    );
    await fireEvent.changeText(getByPlaceholderText("Password"), "SuperSecret123!");
    await pressCreateAccount(getAllByText);

    getByText("An account with this email already exists.");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("handles a thrown registration error gracefully", async () => {
    mockRegister.mockRejectedValue(new Error("Network down"));
    const { getByText, getByPlaceholderText, getAllByText } =
      await render(<SignUpScreen />);

    await fireEvent.changeText(getByPlaceholderText("First Name"), "Demo");
    await fireEvent.changeText(
      getByPlaceholderText("Email Address"),
      "demo@homebase.test",
    );
    await fireEvent.changeText(getByPlaceholderText("Password"), "SuperSecret123!");
    await pressCreateAccount(getAllByText);

    getByText("Network down");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
