import React from "react";
import { render } from "@testing-library/react-native";
import FormField from "@/src/components/auth/FormField";

describe("FormField", () => {
  it("displays the input value", () => {
    const { getByDisplayValue } = render(
      <FormField
        value="Test"
        onChangeText={() => {}}
        placeholder="Placeholder"
      />
    );
    expect(getByDisplayValue("Test")).toBeTruthy();
  });

  it("shows error text when error is provided", () => {
    const { getByText, queryByText } = render(
      <FormField
        value=""
        onChangeText={() => {}}
        placeholder="Placeholder"
        error="Este campo es obligatorio"
        hint="Some hint"
      />
    );
    expect(getByText("Este campo es obligatorio")).toBeTruthy();
    // Hint should NOT be shown when there's an error
    expect(queryByText("Some hint")).toBeNull();
  });

  it("shows hint text when no error", () => {
    const { getByText } = render(
      <FormField
        value=""
        onChangeText={() => {}}
        placeholder="Placeholder"
        hint="This is helpful text"
      />
    );
    expect(getByText("This is helpful text")).toBeTruthy();
  });

  it("shows neither error nor hint when neither is provided", () => {
    const { queryByText } = render(
      <FormField
        value=""
        onChangeText={() => {}}
        placeholder="Placeholder"
      />
    );
    expect(queryByText("This is helpful text")).toBeNull();
  });
});
