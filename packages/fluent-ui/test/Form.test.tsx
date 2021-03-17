import React, { useRef } from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import CoreForm from "@rjsf/core"

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
  test("number field", () => {
    const schema: JSONSchema7 = {
      type: "number",
    };
    const tree = renderer.create(<Form schema={schema} />).toJSON();
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
});

describe("Form", () => {
  test("Renders with appropriate refs", () => {
    function FormWithRef() {
      const ref = useRef<
        CoreForm<{
          field: string;
        }>
      >(null);
    
      return (
        <Form<{
          field: string;
        }>
          ref={ref}
          formData={{
            field: "",
          }}
          schema={{
            type: "object",
            properties: {
              field: {
                type: "string",
              },
            },
          }}
        />
      );
    }
    
    const el = renderer.create(<FormWithRef />).toJSON();

    expect(el).toMatchSnapshot();
  });
});