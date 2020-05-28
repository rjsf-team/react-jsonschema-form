import React from 'react';
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("DateWidget", () => {
  test("Render date input with title property defined", () => {
      const schema: JSONSchema7 = {
        type: "string", format: "date",  title: "date title" 
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
  });
  test("Render date input without title property defined", () => {
      //The label of this input should be set based on the name of the property name, "dateNoTitle"
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          dateNoTitle: { type: "string", format: "date" }
        }
      };
      const tree = renderer.create(<Form schema={schema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
});

