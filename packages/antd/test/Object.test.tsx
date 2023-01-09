import React from "react";
import renderer from "react-test-renderer";
import validator from "@rjsf/validator-ajv8";
import { RJSFSchema } from "@rjsf/utils";

import "../__mocks__/matchMedia.mock";
import Form from "../src";

describe("object fields", () => {
  test("object", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        a: { type: "string", title: "A" },
        b: { type: "number", title: "B" },
      },
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("additionalProperties", () => {
    const schema: RJSFSchema = {
      type: "object",
      additionalProperties: true,
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} formData={{ foo: "foo" }} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
