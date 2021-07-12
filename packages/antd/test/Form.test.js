import React from 'react';
import renderer from 'react-test-renderer';
import { withTheme } from '@rjsf/core';

import '../__mocks__/matchMedia.mock';
import { Theme } from '../src';

const { describe, expect, test } = global;

const Form = withTheme(Theme);

describe("single fields", () => {
  describe("string field", () => {
    test("regular", () => {
      const schema = {
        type: "string"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format email", () => {
      const schema = {
        type: "string",
        format: "email"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format uri", () => {
      const schema = {
        type: "string",
        format: "uri"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format data-url", () => {
      const schema = {
        type: "string",
        format: "data-url",
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  test("number field", () => {
    const schema = {
      type: "number"
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("null field", () => {
    const schema = {
      type: "null"
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("unsupported field", () => {
    const schema = {
      type: undefined
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden field", () => {
    const schema = {
      type: "object",
      properties: {
        "my-field": {
          type: "string",
        },
      },
    };
    const uiSchema = {
      "my-field": {
        "ui:widget": "hidden",
      },
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
