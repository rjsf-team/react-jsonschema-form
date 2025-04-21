import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8"; // Import validator for error testing

import { createFormComponent } from "./testUtils";

describe("StringField", () => {
  it("should render a string field", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "My String Field",
    };
    createFormComponent({ schema });

    const label = screen.getByText("My String Field");
    expect(label).toBeInTheDocument();
    const input = screen.getByLabelText("My String Field");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("usa-input");
  });

  it("should handle input change", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "Test Input",
    };
    const onChange = jest.fn();
    createFormComponent({ schema, onChange });

    const input = screen.getByLabelText("Test Input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "new value" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: "new value" }),
      expect.any(String),
    );
    expect(input.value).toBe("new value");
  });

  it("should render a textarea for ui:widget: textarea", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "My Textarea",
    };
    const uiSchema = { "ui:widget": "textarea" };
    createFormComponent({ schema, uiSchema });

    const textarea = screen.getByLabelText("My Textarea");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveClass("usa-textarea");
  });

  it("should handle textarea change", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "Test Textarea",
    };
    const uiSchema = { "ui:widget": "textarea" };
    const onChange = jest.fn();
    createFormComponent({ schema, uiSchema, onChange });

    const textarea = screen.getByLabelText("Test Textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "new text" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: "new text" }),
      expect.any(String),
    );
    expect(textarea.value).toBe("new text");
  });

  it("should render required asterisk", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "Required String",
    };
    createFormComponent({ schema, required: [""] }); // Root element required

    const label = screen.getByText("Required String");
    expect(label).toBeInTheDocument();
    const requiredSpan = label.querySelector(".usa-label--required");
    expect(requiredSpan).toBeInTheDocument();
    expect(requiredSpan).toHaveTextContent("*");
  });

  it("should render error state", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "String with Error",
      minLength: 10,
    };
    const formData = "short";
    // Simulate validation to generate errors
    const { container } = createFormComponent({
      schema,
      formData,
      validator,
      showErrorList: false, // Hide form-level list for clarity
    });

    // Trigger validation by attempting a change (or directly pass errors if needed)
    const input = screen.getByLabelText("String with Error");
    fireEvent.blur(input); // Trigger validation on blur

    const formGroup = container.querySelector(".usa-form-group");
    expect(formGroup).toHaveClass("usa-form-group--error");

    const label = screen.getByText("String with Error");
    expect(label).toHaveClass("usa-label--error");

    const errorMessage = screen.getByRole("alert"); // FieldErrorTemplate renders span with role="alert"
    expect(errorMessage).toHaveClass("usa-error-message");
    expect(errorMessage).toHaveTextContent("must NOT have fewer than 10 characters");
  });

  it("should render disabled state", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "Disabled String",
    };
    createFormComponent({ schema, disabled: true });

    const input = screen.getByLabelText("Disabled String");
    expect(input).toBeDisabled();
  });

  it("should render readonly state", () => {
    const schema: RJSFSchema = {
      type: "string",
      title: "Readonly String",
    };
    createFormComponent({ schema, readonly: true });

    const input = screen.getByLabelText("Readonly String");
    expect(input).toHaveAttribute("readonly");
  });
});
