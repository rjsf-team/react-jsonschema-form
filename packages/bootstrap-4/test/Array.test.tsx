import React from 'react';
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import Form from "../src/index";

describe("array fields", () => {
  test("array", () => {
    const schema: RJSFSchema = {
      type: "array",
      items: {
        type: "string"
      }
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("fixed array", () => {
    const schema: RJSFSchema = {
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
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes", () => {
    const schema: RJSFSchema = {
      type: "array",
      items: {
        type: "string",
        enum: ["a", "b", "c"]
      },
      uniqueItems: true
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
