import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import Form from "../src/index";

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
  test("string field with placeholder", () => {
    const schema = {
      type: "string",
    };
    const uiSchema = {
      "ui:placeholder": "placeholder",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
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
  test("number field 0", () => {
    const schema = {
      type: "number",
    };
    const formData = 0;
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} formData={formData} />
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
  test("format color", () => {
    const schema = {
      type: "string",
      format: "color",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("format date", () => {
    const schema = {
      type: "string",
      format: "date",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("format datetime", () => {
    const schema = {
      type: "string",
      format: "datetime",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("password field", () => {
    const schema = {
      type: "string",
    };
    const uiSchema = {
      "ui:widget": "password",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("up/down field", () => {
    const schema = {
      type: "number",
    };
    const uiSchema = {
      "ui:widget": "updown",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("textarea field", () => {
    const schema = {
      type: "string",
    };
    const uiSchema = {
      "ui:widget": "textarea",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("select field", () => {
    const schema = {
      type: "string",
      enum: ["foo", "bar"],
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkbox field", () => {
    const schema = {
      type: "boolean",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkbox field", () => {
    const schema = {
      type: "boolean",
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes field", () => {
    const schema = {
      type: "array",
      items: {
        type: "string",
        enum: ["foo", "bar", "fuzz", "qux"],
      },
      uniqueItems: true,
    };
    const uiSchema = {
      "ui:widget": "checkboxes",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("radio field", () => {
    const schema = {
      type: "boolean",
    };
    const uiSchema = {
      "ui:widget": "radio",
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("slider field", () => {
    const schema = {
      type: "integer",
      minimum: 42,
      maximum: 100,
    };
    const uiSchema = {
      "ui:widget": "range",
    };
    const tree = renderer
      .create(
        <Form
          schema={schema}
          validator={validator}
          uiSchema={uiSchema}
          formData={75}
        />
      )
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
  test("title field", () => {
    const schema = {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
      },
    };
    const uiSchema = {
      "ui:title": "Titre 1",
      title: {
        "ui:title": "Titre 2",
      },
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("hidden label", () => {
    const schema = {
      type: "string",
    };
    const uiSchema = {
      "ui:options": {
        label: false,
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
  test("field with special semantic options", () => {
    const schema = {
      title: "A registration form",
      description: "A simple test theme form example.",
      type: "object",
      required: ["test"],
      properties: {
        test: {
          enum: [1, 2, 3],
          title: "test",
        },
      },
    };
    const uiSchema = {
      test: {
        "ui:options": {
          semantic: {
            fluid: true,
          },
        },
      },
    };
    const tree = renderer
      .create(
        <Form schema={schema} validator={validator} uiSchema={uiSchema} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
