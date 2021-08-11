import React from 'react';
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer  from "react-test-renderer";

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
  test("array icons", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string"
      }
    };
    const tree = renderer
      .create(<Form schema={schema} formData={['a', 'b']} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("array with custom AddButton text", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string",
      }
    };
    const uiSchema = {
      "ui:addButtonText": "Custom button text"
    };
    const testRenderer = renderer.create(<Form schema={schema} uiSchema={uiSchema} />)

    expect(testRenderer.root.findByProps({ addButtonText: "Custom button text" })).toBeTruthy();
  });
});