import React from 'react';
import renderer from 'react-test-renderer';

import '../__mocks__/matchMedia.mock';
import Form from '../src';

const { describe, expect, test } = global;

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
});
