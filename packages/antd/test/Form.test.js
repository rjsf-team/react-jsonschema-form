import React from "react";
import renderer from "react-test-renderer";
import validator from "@rjsf/validator-ajv6";

import "../__mocks__/matchMedia.mock";
import Form from "../src";

const { describe, expect, test } = global;

describe("single fields", () => {
  describe("string field", () => {
    test("regular", () => {
      const schema = {
        type: "string",
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format email", () => {
      const schema = {
        type: "string",
        format: "email",
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format uri", () => {
      const schema = {
        type: "string",
        format: "uri",
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format data-url", () => {
      const schema = {
        type: "string",
        format: "data-url",
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  test("number field", () => {
    const schema = {
      type: "number",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("date field", () => {
    const uiSchema = { "ui:widget": "date" };
    const schema = {
      type: "string",
      format: "date",
    };
    const tree = renderer
      .create(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("null field", () => {
    const schema = {
      type: "null",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("unsupported field", () => {
    const schema = {
      type: undefined,
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden field", () => {
    const schema = {
      type: "object",
      properties: {
        "my-field": {
          type: "string",
        },
      },
    };
    const uiSchema = {
      "my-field": {
        "ui:widget": "hidden",
      },
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("field with description", () => {
    const schema = {
      type: "object",
      properties: {
        "my-field": {
          type: "string",
          description: "some description",
        },
      },
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("field with description in uiSchema", () => {
    const schema = {
      type: "object",
      properties: {
        "my-field": {
          type: "string",
          description: "some description",
        },
      },
    };
    const uiSchema = {
      "my-field": {
        "ui:description": "some other description",
      },
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("using custom tagName", () => {
    const schema = {
      type: "string",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} tagName="div" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
