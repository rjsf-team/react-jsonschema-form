import React from 'react';
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import { MuiForm5 as Form } from "../../src";

describe("object fields", () => {
  test("object", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        a: {type: "string"},
        b: {type: "number"}
      }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("additionalProperties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      additionalProperties: true
    };
    const tree = renderer
      .create(<Form schema={schema} formData={{foo: 'foo'}} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
