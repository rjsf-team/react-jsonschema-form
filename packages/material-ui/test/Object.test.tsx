import React from 'react';
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("object fields", () => {
  test("object", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        a: {type: "string"},
        b: {type: "number"}
      }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("additionalProperties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      additionalProperties: true
    };
    const tree = renderer
      .create(<Form schema={schema} formData={{foo: 'foo'}} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("With custom AddButton text", () => {
    const schema: JSONSchema7 = {
      type: "object",
      additionalProperties: true
    };

    const uiSchema = {
      "ui:addButtonText": "Custom button text"
    };

    const testRenderer = renderer.create(<Form schema={schema} uiSchema={uiSchema} />);

    const addButton = testRenderer.root.findByProps({ addButtonText: "Custom button text" });

    expect(addButton).toBeTruthy();
  });
});