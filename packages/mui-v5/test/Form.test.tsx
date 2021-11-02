import React from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import { UiSchema } from "@rjsf/core";

describe("single fields", () => {
  describe("string field", () => {
    test("regular", () => {
      const schema: JSONSchema7 = {
        type: "string",
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format email", () => {
      const schema: JSONSchema7 = {
        type: "string",
        format: "email",
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format uri", () => {
      const schema: JSONSchema7 = {
        type: "string",
        format: "uri",
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format data-url", () => {
      const schema: JSONSchema7 = {
        type: "string",
        format: "data-url",
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  test("string field with placeholder", () => {
    const schema: JSONSchema7 = {
      type: "string",
    };
    const uiSchema: UiSchema = {
      "ui:placeholder": "placeholder",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("number field", () => {
    const schema: JSONSchema7 = {
      type: "number",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("number field 0", () => {
    const schema: JSONSchema7 = {
      type: "number",
    };
    const formData = 0;
    const tree = renderer
      .create(<Form schema={schema} formData={formData} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("null field", () => {
    const schema: JSONSchema7 = {
      type: "null",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("unsupported field", () => {
    const schema: JSONSchema7 = {
      type: undefined,
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("format color", () => {
    const schema: JSONSchema7 = {
      type: "string",
      format: "color",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("format date", () => {
    const schema: JSONSchema7 = {
      type: "string",
      format: "date",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("format datetime", () => {
    const schema: JSONSchema7 = {
      type: "string",
      format: "datetime",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("password field", () => {
    const schema: JSONSchema7 = {
      type: "string",
    };
    const uiSchema: UiSchema = {
      "ui:widget": "password",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("textarea field", () => {
    const schema: JSONSchema7 = {
      type: "string",
    };
    const uiSchema: UiSchema = {
      "ui:widget": "textarea",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("select field", () => {
    const schema: JSONSchema7 = {
      type: "string",
      enum: ["foo", "bar"],
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkbox field", () => {
    const schema: JSONSchema7 = {
      type: "boolean",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkbox field", () => {
    const schema: JSONSchema7 = {
      type: "boolean",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes field", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string",
        enum: ["foo", "bar", "fuzz", "qux"],
      },
      uniqueItems: true,
    };
    const uiSchema: UiSchema = {
      "ui:widget": "checkboxes",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("radio field", () => {
    const schema: JSONSchema7 = {
      type: "boolean",
    };
    const uiSchema: UiSchema = {
      "ui:widget": "radio",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  // There is a bug in the Material UI <Slider /> component that prevents this from working.
  // Error: `TypeError: Cannot read property 'addEventListener' of null`
  // From: https://github.com/mui-org/material-ui/blob/v4.5.2/packages/material-ui/src/Slider/Slider.js#L622
  test.skip("slider field", () => {
    const schema: JSONSchema7 = {
      type: "integer",
      minimum: 42,
      maximum: 100,
    };
    const uiSchema: UiSchema = {
      "ui:widget": "range",
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden field", () => {
    const schema: JSONSchema7 = {
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
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden label", () => {
    const schema: JSONSchema7 = {
      type: "string",
    };
    const uiSchema: UiSchema = {
      "ui:options": {
        label: false,
      },
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
