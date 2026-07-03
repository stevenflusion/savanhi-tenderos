import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RadioOption from "@/src/components/auth/RadioOption";

describe("RadioOption", () => {
  it("renders the label", () => {
    const { getByText } = render(
      <RadioOption label="Efectivo" selected={false} onSelect={() => {}} />
    );
    expect(getByText("Efectivo")).toBeTruthy();
  });

  it("fires onSelect when pressed", () => {
    const onSelect = jest.fn();
    const { getByRole } = render(
      <RadioOption label="Efectivo" selected={false} onSelect={onSelect} />
    );

    // Pressable renders with accessibilityRole="button"
    const button = getByRole("button");
    fireEvent.press(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
