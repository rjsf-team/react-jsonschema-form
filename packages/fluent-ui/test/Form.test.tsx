import CoreForm from "@rjsf/core";
import { JSONSchema7 } from "json-schema";
import React from "react";
import renderer from "react-test-renderer";
import Form from "../src/index";

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

describe("refs", () => {
  test("Renders with a ref and the Form Element accepts a generic formData argument", () => {  
    let ref = React.createRef<CoreForm<{
      field: string;
    }>>()
 
    renderer.create(
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
    
    expect(ref.current).toBeDefined();
    expect(ref.current!.submit).toBeDefined();
    expect(ref.current!.formElement).toBeDefined();
    expect(ref.current!.validate).toBeDefined();
  });
});
