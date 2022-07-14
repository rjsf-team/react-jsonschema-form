import React from 'react';
import renderer from "react-test-renderer";
import validator from "@rjsf/validator-ajv6";

import '../__mocks__/matchMedia.mock';
import Form from '../src';

const { describe, expect, test } = global;

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
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
