import React from "react";
import renderer from "react-test-renderer";
import validator from "@rjsf/validator-ajv6";

import "../__mocks__/matchMedia.mock";
import Form from "../src";

const { describe, expect, test } = global;

describe("array fields", () => {
  test("array", () => {
    const schema = {
      type: "array",
      items: {
        type: "string",
      },
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("fixed array", () => {
    const schema = {
      type: "array",
      items: [
        {
          type: "string",
        },
        {
          type: "number",
        },
      ],
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes", () => {
    const schema = {
      type: "array",
      items: {
        type: "string",
        enum: ["a", "b", "c"],
      },
      uniqueItems: true,
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
