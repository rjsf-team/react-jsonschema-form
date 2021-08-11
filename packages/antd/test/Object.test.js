import React from 'react';
import renderer from "react-test-renderer";
import { withTheme } from '@rjsf/core';

import '../__mocks__/matchMedia.mock';
import { Theme } from '../src';

import Button from "antd/lib/button";

const { describe, expect, test } = global;

const Form = withTheme(Theme);

describe("object fields", () => {
  test("object", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" }
      }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("Object with custom AddButton text", () => {
    const schema = {
      type: "object",
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

    const addButton = testRenderer.root.findByType(Button);

    expect(addButton.props.children[2]).toBe("Custom button text");
  });
});
