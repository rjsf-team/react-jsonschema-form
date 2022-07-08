/** @jsx jsx */
import { jsx } from "@emotion/react";
import renderer from "react-test-renderer";
import { UiSchema, RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv6";

import Form from "../src/index";

describe("single fields", () => {
  describe("string field", () => {
    test("regular", () => {
      const schema: RJSFSchema = {
        type: "string",
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format email", () => {
      const schema: RJSFSchema = {
        type: "string",
        format: "email",
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format uri", () => {
      const schema: RJSFSchema = {
        type: "string",
        format: "uri",
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format data-url", () => {
      const schema: RJSFSchema = {
        type: "string",
        format: "data-url",
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  test("number field", () => {
    const schema: RJSFSchema = {
      type: "number",
    };
    const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("null field", () => {
    const schema: RJSFSchema = {
      type: "null",
    };
    const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("unsupported field", () => {
    const schema: RJSFSchema = {
      type: undefined,
    };
    const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden field", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        "my-field": {
          type: "string",
        },
      },
    };
    const uiSchema: UiSchema = {
      "my-field": {
        "ui:widget": "hidden",
      },
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("using custom tagName", () => {
    const schema: RJSFSchema = {
      type: "string"
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} tagName="div"/>)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
