import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BackButton from "@/src/components/auth/BackButton";

// Mock expo-router
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe("BackButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBack.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<BackButton />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("fires onPress when provided", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<BackButton onPress={onPress} />);

    const button = getByRole("button");
    fireEvent.press(button);
    jest.advanceTimersByTime(100);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls router.back when no onPress provided", () => {
    const { getByRole } = render(<BackButton />);

    const button = getByRole("button");
    fireEvent.press(button);
    jest.advanceTimersByTime(100);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
