import React from 'react';
import renderer from 'react-test-renderer';
import { withTheme } from '@rjsf/core';

import '../__mocks__/matchMedia.mock';
import { Theme } from '../src';
import Button from "antd/lib/button";

const { describe, expect, test } = global;

const Form = withTheme(Theme);

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
  test("Array with custom AddButton text", () => {
    const schema = {
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

    const addButton = testRenderer.root.findByType(Button);

    expect(addButton.props.children[2]).toBe("Custom button text");
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
});
