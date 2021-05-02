import React from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer, { ReactTestRendererNode } from "react-test-renderer";

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
    const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} />)
        .toJSON();

    if (tree === null || typeof tree === "string" || !tree.children)
      throw new Error("Component tree is not built correctly");

    const indexes = [0, 0, 0, 1, 0, 0];
    let buttonNode = tree.children[0];

    for (let i of indexes) {
      if (!buttonNode || typeof buttonNode === "string")
        throw new Error("The current node is not a ReactTestRendererJson");

      if (buttonNode.children === null)
        throw new Error("The current node has no children");

      buttonNode = buttonNode.children[i] as ReactTestRendererNode;
    }

    expect(buttonNode).toBe("Custom button text");
  });
});