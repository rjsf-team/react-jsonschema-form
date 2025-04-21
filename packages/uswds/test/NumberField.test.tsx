import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8"; // Import validator

import { createFormComponent } from "./testUtils";

describe("NumberField", () => {
  it("should render a number field", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "My Number Field",
    };
    createFormComponent({ schema });

    const label = screen.getByText("My Number Field");
    expect(label).toBeInTheDocument();
    const input = screen.getByLabelText("My Number Field");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveClass("usa-input");
  });

  it("should handle input change", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "Test Input",
    };
    const onChange = jest.fn();
    createFormComponent({ schema, onChange });

    const input = screen.getByLabelText("Test Input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "123.45" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: 123.45 }),
      expect.any(String),
    );
    expect(input.value).toBe("123.45");
  });

  it("should handle integer input change", () => {
    const schema: RJSFSchema = {
      type: "integer",
      title: "Test Integer Input",
    };
    const onChange = jest.fn();
    createFormComponent({ schema, onChange });

    const input = screen.getByLabelText("Test Integer Input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "123" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: 123 }),
      expect.any(String),
    );
    expect(input.value).toBe("123");
  });

  it("should render required asterisk", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "Required Number",
    };
    createFormComponent({ schema, required: [""] });

    const label = screen.getByText("Required Number");
    expect(label.querySelector(".usa-label--required")).toHaveTextContent("*");
  });

  it("should render error state", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "Number with Error",
      minimum: 10,
    };
    const formData = 5;
    const { container } = createFormComponent({
      schema,
      formData,
      validator,
      showErrorList: false,
    });

    const input = screen.getByLabelText("Number with Error");
    fireEvent.blur(input);

    expect(container.querySelector(".usa-form-group")).toHaveClass("usa-form-group--error");
    expect(screen.getByText("Number with Error")).toHaveClass("usa-label--error");
    expect(screen.getByRole("alert")).toHaveClass("usa-error-message");
    expect(screen.getByRole("alert")).toHaveTextContent("must be >= 10");
  });

  it("should render disabled state", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "Disabled Number",
    };
    createFormComponent({ schema, disabled: true });
    expect(screen.getByLabelText("Disabled Number")).toBeDisabled();
  });

  it("should render readonly state", () => {
    const schema: RJSFSchema = {
      type: "number",
      title: "Readonly Number",
    };
    createFormComponent({ schema, readonly: true });
    expect(screen.getByLabelText("Readonly Number")).toHaveAttribute("readonly");
  });
});
