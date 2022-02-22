import React from 'react';
import Form from "../src/index";
import renderer from "react-test-renderer";

describe("single fields", () => {
  describe("string field", () => {
    test("regular", () => {
      const schema = {
        type: "string"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format email", () => {
      const schema = {
        type: "string",
        format: "email"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format uri", () => {
      const schema = {
        type: "string",
        format: "uri"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("format data-url", () => {
      const schema = {
        type: "string",
        format: "data-url"
      };
      const tree = renderer
        .create(<Form schema={schema} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  test("number field", () => {
    const schema = {
      type: "number"
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("null field", () => {
    const schema = {
      type: "null"
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("unsupported field", () => {
    const schema = {
      type: undefined
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test("uiSchema theme props", () => {
    const schema = {
      "title": "A registration form",
      "description": "A simple test theme form example.",
      "type": "object",
      "required": [
        "test"
      ],
      "properties": {
        "test": {
           "enum": [
            1,
            2,
            3
          ],
          "title": "test"
        }
      }
    };
    const uiSchema = {
      "test": {
        "ui:options": {
          "semantic":{
            "fluid":true
          }
        }
      }
    };
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("testing with tagName", () => {
    const schema = {
      type: "string"
    };
    const tree = renderer
      .create(<Form schema={schema} tagName="div" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

});
