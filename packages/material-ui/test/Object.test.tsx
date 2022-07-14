import React from 'react';
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import { MuiForm4 as Form } from "../src/index";

describe("object fields", () => {
  test("object", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        a: {type: "string"},
        b: {type: "number"}
      }
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("additionalProperties", () => {
    const schema: RJSFSchema = {
      type: "object",
      additionalProperties: true
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} formData={{foo: 'foo'}} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
