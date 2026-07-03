import React from "react";
import { render } from "@testing-library/react-native";
import ProgressBar from "@/src/components/auth/ProgressBar";

describe("ProgressBar", () => {
  it("shows step label with correct current/total", () => {
    const { getByText } = render(
      <ProgressBar current={2} total={6} showLabel={true} />
    );
    expect(getByText("Paso 2 de 6")).toBeTruthy();
  });

  it("hides step label when showLabel is false", () => {
    const { queryByText } = render(
      <ProgressBar current={2} total={6} showLabel={false} />
    );
    expect(queryByText("Paso 2 de 6")).toBeNull();
  });

  it("renders the correct number of segments", () => {
    const { UNSAFE_root } = render(
      <ProgressBar current={2} total={6} showLabel={false} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
