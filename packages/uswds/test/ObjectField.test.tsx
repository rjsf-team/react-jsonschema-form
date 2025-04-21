import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8"; // Import validator

import { createFormComponent } from "./testUtils";

describe("ObjectField", () => {
  const schema: RJSFSchema = {
    type: "object",
    title: "My Object Field",
    properties: {
      prop1: { type: "string", title: "Property 1" },
      prop2: { type: "number", title: "Property 2" },
    },
  };

  it("should render an object field with properties", () => {
    createFormComponent({ schema });
    expect(screen.getByText("My Object Field")).toBeInTheDocument();
    expect(screen.getByLabelText("Property 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Property 2")).toBeInTheDocument();
  });

  it("should handle property input change", () => {
    const onChange = jest.fn();
    createFormComponent({ schema, onChange });

    const inputProp1 = screen.getByLabelText("Property 1") as HTMLInputElement;
    fireEvent.change(inputProp1, { target: { value: "value1" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: { prop1: "value1" } }),
      expect.any(String),
    );

    const inputProp2 = screen.getByLabelText("Property 2") as HTMLInputElement;
    fireEvent.change(inputProp2, { target: { value: "100" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: { prop1: "value1", prop2: 100 } }),
      expect.any(String),
    );
  });

  it("should render required asterisk on required property labels", () => {
    const requiredSchema: RJSFSchema = { ...schema, required: ["prop1"] };
    createFormComponent({ schema: requiredSchema });

    const label1 = screen.getByText("Property 1");
    expect(label1.querySelector(".usa-label--required")).toHaveTextContent("*");

    const label2 = screen.getByText("Property 2");
    expect(label2.querySelector(".usa-label--required")).toBeNull();
  });

  it("should render error state on properties", () => {
    const errorSchema: RJSFSchema = {
      ...schema,
      properties: {
        prop1: { type: "string", title: "Prop 1 Error", minLength: 5 },
      },
      required: ["prop1"], // Make it required to easily trigger error
    };
    const formData = { prop1: "abc" }; // Invalid data
    createFormComponent({
      schema: errorSchema,
      formData,
      validator,
      showErrorList: false,
    });

    const input = screen.getByLabelText(/Prop 1 Error/); // Use regex for partial match with asterisk
    fireEvent.blur(input);

    const formGroup = input.closest(".usa-form-group");
    expect(formGroup).toHaveClass("usa-form-group--error");

    const label = screen.getByText("Prop 1 Error");
    expect(label).toHaveClass("usa-label--error");

    const errorMessage = formGroup?.querySelector(".usa-error-message");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent("must NOT have fewer than 5 characters");
  });

  it("should disable properties when disabled", () => {
    createFormComponent({ schema, disabled: true });
    expect(screen.getByLabelText("Property 1")).toBeDisabled();
    expect(screen.getByLabelText("Property 2")).toBeDisabled();
  });

  it("should make properties readonly when readonly", () => {
    createFormComponent({ schema, readonly: true });
    expect(screen.getByLabelText("Property 1")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Property 2")).toHaveAttribute("readonly");
  });

  // Add tests for additionalProperties button disabled/readonly states if applicable
});
