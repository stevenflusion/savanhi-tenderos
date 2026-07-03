import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import FormButton from "@/src/components/auth/FormButton";

describe("FormButton", () => {
  it("renders the label text", () => {
    const { getByText } = render(
      <FormButton label="Continuar" valid={false} loading={false} onPress={() => {}} />
    );
    expect(getByText("Continuar")).toBeTruthy();
  });

  it("shows loading spinner and loadingLabel when loading", () => {
    const { getByText, queryByText } = render(
      <FormButton
        label="Continuar"
        loadingLabel="Guardando..."
        valid={true}
        loading={true}
        onPress={() => {}}
      />
    );
    expect(getByText("Guardando...")).toBeTruthy();
    expect(queryByText("Continuar")).toBeNull();
  });

  it("is disabled when valid is false", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FormButton label="Continuar" valid={false} loading={false} onPress={onPress} />
    );
    fireEvent.press(getByText("Continuar"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is disabled when loading is true", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FormButton
        label="Continuar"
        valid={true}
        loading={true}
        onPress={onPress}
      />
    );
    fireEvent.press(getByText("Continuar"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("fires onPress when valid and not loading", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FormButton label="Continuar" valid={true} loading={false} onPress={onPress} />
    );
    fireEvent.press(getByText("Continuar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
