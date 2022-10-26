import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import renderer from "react-test-renderer";

import Form from "../src";

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
jest.mock("@fluentui/react-component-ref", () => ({
  ...jest.requireActual("@fluentui/react-component-ref"),
  Ref: jest.fn().mockImplementation(({ children }) => children),
}));

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
