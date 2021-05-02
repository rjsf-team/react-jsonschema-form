import React from 'react';
import renderer from 'react-test-renderer';
import { withTheme } from '@rjsf/core';

import '../__mocks__/matchMedia.mock';
import { Theme } from '../src';

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
  test("array with custom addButtonText", () => {
    const schema = {
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

    const buttonNode = tree.children[0].children[0].children[0].children[1].children[0]
        .children[0].children[0].children[1];

    expect(buttonNode.children[0]).toBe(" Custom button text");
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
