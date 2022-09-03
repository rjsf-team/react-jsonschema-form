import React from "react";
import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import Form from "../src/index";

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
jest.mock("@fluentui/react-component-ref", () => ({
  ...jest.requireActual("@fluentui/react-component-ref"),
  Ref: jest.fn().mockImplementation(({ children }) => children),
}));

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
  test("array icons", () => {
    const schema = {
      type: "array",
      items: {
        type: "string",
      },
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} formData={["a", "b"]} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("no errors", () => {
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("empty errors array", () => {
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
    };
    const tree = renderer
      .create(
        <Form
          schema={schema}
          validator={validator}
          extraErrors={{ name: { __errors: [] } }}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
