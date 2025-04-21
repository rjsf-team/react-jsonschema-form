import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8"; // Import validator

import { createFormComponent } from "./testUtils";

describe("BooleanField", () => {
  // --- Checkbox Tests ---
  describe("Checkbox", () => {
    it("should render a boolean field (checkbox)", () => {
      const schema: RJSFSchema = {
        type: "boolean",
        title: "My Boolean Field",
      };
      createFormComponent({ schema });

      const checkbox = screen.getByLabelText("My Boolean Field");
      expect(checkbox).toHaveAttribute("type", "checkbox");
      expect(checkbox).toHaveClass("usa-checkbox__input");
      expect(checkbox.parentElement).toHaveClass("usa-checkbox");
    });

    it("should handle checkbox change", () => {
      const schema: RJSFSchema = {
        type: "boolean",
        title: "Test Checkbox",
      };
      const onChange = jest.fn();
      createFormComponent({ schema, onChange });

      const checkbox = screen.getByLabelText("Test Checkbox") as HTMLInputElement;
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ formData: true }),
        expect.any(String),
      );
      expect(checkbox.checked).toBe(true);
    });

    it("should render required asterisk", () => {
      const schema: RJSFSchema = { type: "boolean", title: "Required Checkbox" };
      createFormComponent({ schema, required: [""] });
      const label = screen.getByText("Required Checkbox");
      expect(label.querySelector(".usa-label--required")).toHaveTextContent("*");
    });

    it("should render disabled state", () => {
      const schema: RJSFSchema = { type: "boolean", title: "Disabled Checkbox" };
      createFormComponent({ schema, disabled: true });
      expect(screen.getByLabelText("Disabled Checkbox")).toBeDisabled();
    });

    it("should render readonly state (as disabled)", () => {
      const schema: RJSFSchema = { type: "boolean", title: "Readonly Checkbox" };
      createFormComponent({ schema, readonly: true });
      expect(screen.getByLabelText("Readonly Checkbox")).toBeDisabled();
    });
  });

  // --- Radio Tests ---
  describe("Radio", () => {
    const radioSchema: RJSFSchema = {
      type: "boolean",
      title: "Test Radio",
      enum: [true, false],
      enumNames: ["Yes", "No"],
    };
    const radioUiSchema = { "ui:widget": "radio" };

    it("should render radio buttons for enum", () => {
      const schema: RJSFSchema = {
        type: "boolean",
        title: "My Radio Field",
        enum: [true, false],
        enumNames: ["Yes", "No"],
      };
      const uiSchema = { "ui:widget": "radio" };
      createFormComponent({ schema, uiSchema });

      const radioYes = screen.getByLabelText("Yes");
      const radioNo = screen.getByLabelText("No");
      expect(radioYes).toHaveAttribute("type", "radio");
      expect(radioNo).toHaveAttribute("type", "radio");
      expect(radioYes).toHaveClass("usa-radio__input");
      expect(radioNo).toHaveClass("usa-radio__input");
      expect(radioYes.closest(".usa-radio")).toBeInTheDocument();
      expect(radioNo.closest(".usa-radio")).toBeInTheDocument();
    });

    it("should handle radio change", () => {
      const schema: RJSFSchema = {
        type: "boolean",
        title: "Test Radio",
        enum: [true, false],
        enumNames: ["Yes", "No"],
      };
      const uiSchema = { "ui:widget": "radio" };
      const onChange = jest.fn();
      createFormComponent({ schema, uiSchema, onChange });

      const radioNo = screen.getByLabelText("No") as HTMLInputElement;
      fireEvent.click(radioNo);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ formData: false }),
        expect.any(String),
      );
      expect(radioNo.checked).toBe(true);
    });

    it("should render required asterisk on legend", () => {
      createFormComponent({ schema: radioSchema, uiSchema: radioUiSchema, required: [""] });
      const legend = screen.getByText("Test Radio");
      expect(legend.tagName).toBe("LEGEND");
      expect(legend.querySelector(".usa-label--required")).toHaveTextContent("*");
    });

    it("should render error state", () => {
      const errors = ["This radio group has an error"];
      const { container } = createFormComponent({
        schema: radioSchema,
        uiSchema: radioUiSchema,
        extraErrors: { __errors: errors } as any,
        showErrorList: false,
        validator,
      });

      const fieldset = container.querySelector("fieldset");
      expect(fieldset?.parentElement).toHaveClass("usa-form-group--error");
      const legend = screen.getByText("Test Radio");
      expect(legend).toHaveClass("usa-legend");

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveClass("usa-error-message");
      expect(errorMessage).toHaveTextContent(errors[0]);
    });

    it("should render disabled state", () => {
      createFormComponent({ schema: radioSchema, uiSchema: radioUiSchema, disabled: true });
      expect(screen.getByLabelText("Yes")).toBeDisabled();
      expect(screen.getByLabelText("No")).toBeDisabled();
    });

    it("should render readonly state (as disabled)", () => {
      createFormComponent({ schema: radioSchema, uiSchema: radioUiSchema, readonly: true });
      expect(screen.getByLabelText("Yes")).toBeDisabled();
      expect(screen.getByLabelText("No")).toBeDisabled();
    });
  });
});
