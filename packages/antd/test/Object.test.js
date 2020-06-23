import React from 'react';
import renderer from "react-test-renderer";
import { withTheme } from '@rjsf/core';

import '../__mocks__/matchMedia.mock';
import { Theme } from '../src';

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
});
