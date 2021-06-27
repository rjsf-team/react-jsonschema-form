import React from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import AddButton from "../src/AddButton";

describe("array fields", () => {
  test("array", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string"
      }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("fixed array", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: [
        {
          type: "string"
        },
        {
          type: "number"
        }
      ]
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string",
        enum: ["a", "b", "c"]
      },
      uniqueItems: true
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("array with custom addButtonText", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string"
      }
    };
    const uiSchema = {
      "ui:addButtonText": "Custom button text"
    };
    const testRenderer = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} />);

    const addButton = testRenderer.root.findByType(AddButton).findByProps({ addButtonText: "Custom button text" });

    expect(addButton).toBeTruthy();
  });
});