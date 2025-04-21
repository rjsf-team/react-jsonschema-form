import React from "react";
import { fireEvent, screen, within } from "@testing-library/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8"; // Import validator

import { createFormComponent } from "./testUtils";

describe("ArrayField", () => {
  const schema: RJSFSchema = {
    type: "array",
    title: "My Array Field",
    items: {
      type: "string",
    },
  };

  it("should render an array field", () => {
    createFormComponent({ schema });
    expect(screen.getByText("My Array Field")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Item" })).toBeInTheDocument();
  });

  it("should add an item when Add button is clicked", () => {
    const onChange = jest.fn();
    createFormComponent({ schema, onChange });

    const addButton = screen.getByRole("button", { name: "Add Item" });
    fireEvent.click(addButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: [undefined] }), // Default value for string is undefined
      expect.any(String),
    );
    expect(screen.getAllByLabelText(/My Array Field item \d+/)).toHaveLength(1);
  });

  it("should remove an item when Remove button is clicked", () => {
    const onChange = jest.fn();
    const formData = ["item1", "item2"];
    createFormComponent({ schema, onChange, formData });

    expect(screen.getAllByLabelText(/My Array Field item \d+/)).toHaveLength(2);

    const item1 = screen.getByLabelText("My Array Field item 1").closest(".rjsf-uswds-array-item");
    if (!item1) throw new Error("Item 1 not found");
    const removeButton = within(item1).getByRole("button", { name: "Remove Item" });
    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: ["item2"] }),
      expect.any(String),
    );
    expect(screen.getAllByLabelText(/My Array Field item \d+/)).toHaveLength(1);
  });

  it("should move an item up", () => {
    const onChange = jest.fn();
    const formData = ["item1", "item2"];
    createFormComponent({ schema, onChange, formData });

    const item2 = screen.getByLabelText("My Array Field item 2").closest(".rjsf-uswds-array-item");
    if (!item2) throw new Error("Item 2 not found");
    const moveUpButton = within(item2).getByRole("button", { name: "Move Item Up" });
    fireEvent.click(moveUpButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: ["item2", "item1"] }),
      expect.any(String),
    );
  });

  it("should move an item down", () => {
    const onChange = jest.fn();
    const formData = ["item1", "item2"];
    createFormComponent({ schema, onChange, formData });

    const item1 = screen.getByLabelText("My Array Field item 1").closest(".rjsf-uswds-array-item");
    if (!item1) throw new Error("Item 1 not found");
    const moveDownButton = within(item1).getByRole("button", { name: "Move Item Down" });
    fireEvent.click(moveDownButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ formData: ["item2", "item1"] }),
      expect.any(String),
    );
  });

  it("should render required asterisk on legend", () => {
    createFormComponent({ schema, required: [""] });
    const legend = screen.getByText("My Array Field");
    expect(legend.tagName).toBe("LEGEND");
    expect(legend.querySelector(".usa-label--required")).toHaveTextContent("*");
  });

  it("should render error state", () => {
    const errorSchema: RJSFSchema = { ...schema, minItems: 2 };
    const formData = ["one"]; // Only one item, violates minItems
    const { container } = createFormComponent({
      schema: errorSchema,
      formData,
      validator,
      showErrorList: false,
    });

    // Trigger validation (e.g., by trying to add/remove or just blur)
    const addButton = screen.getByRole("button", { name: "Add Item" });
    fireEvent.blur(addButton); // Blurring a button might not trigger form validation, depends on RJSF internals.
                               // A more reliable way might be to pass extraErrors if blur doesn't work.

    // Check fieldset for error class (applied by FieldTemplate wrapping the ArrayFieldTemplate)
    const fieldset = container.querySelector("fieldset");
    expect(fieldset?.parentElement).toHaveClass("usa-form-group--error");

    // Check for error message associated with the array field itself
    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toHaveClass("usa-error-message");
    expect(errorMessage).toHaveTextContent("must NOT have fewer than 2 items");
  });

  it("should disable Add button when disabled", () => {
    createFormComponent({ schema, disabled: true });
    expect(screen.getByRole("button", { name: "Add Item" })).toBeDisabled();
  });

  it("should disable Add button when readonly", () => {
    createFormComponent({ schema, readonly: true });
    expect(screen.getByRole("button", { name: "Add Item" })).toBeDisabled();
  });

  it("should disable item action buttons when disabled", () => {
    const formData = ["item1", "item2"];
    createFormComponent({ schema, formData, disabled: true });

    const item1 = screen.getByLabelText("My Array Field item 1").closest(".rjsf-uswds-array-item");
    if (!item1) throw new Error("Item 1 not found");

    expect(within(item1).getByRole("button", { name: "Move Item Down" })).toBeDisabled();
    expect(within(item1).getByRole("button", { name: "Remove Item" })).toBeDisabled();
    // Move up is already disabled for the first item
  });

  it("should disable item action buttons when readonly", () => {
    const formData = ["item1", "item2"];
    createFormComponent({ schema, formData, readonly: true });

    const item1 = screen.getByLabelText("My Array Field item 1").closest(".rjsf-uswds-array-item");
    if (!item1) throw new Error("Item 1 not found");

    expect(within(item1).getByRole("button", { name: "Move Item Down" })).toBeDisabled();
    expect(within(item1).getByRole("button", { name: "Remove Item" })).toBeDisabled();
  });
});
