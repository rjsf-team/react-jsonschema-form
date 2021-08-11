import React from 'react';
import Form from "../src/index";
import renderer from "react-test-renderer";
import AddButton from "../src/AddButton";

describe("array fields", () => {
  test("array", () => {
    const schema = {
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
    const schema = {
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
    const schema = {
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
  test.only("array with custom AddButton text", () => {
    const schema = {
      type: "array",
      items: {
        type: "string"
      },
      additionalProperties: true
    };
    const uiSchema = {
      "ui:addButtonText": "Custom button text"
    };

    const testRenderer = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />);

    const addButton = testRenderer.root.findByType(AddButton);

    expect(addButton.props.addButtonText).toBe("Custom button text");
  });
});
