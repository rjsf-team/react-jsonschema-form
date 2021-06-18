import React from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("AdditionalProperties tests", () => {
    test("show hidden fields if additional properties is true", () => {
      const schema: JSONSchema7 = {
        additionalProperties: true,
      };
      const formData: any = {
        "additionalProperty": 'myValue'

      }
      const tree = renderer.create(<Form schema={schema} formData={formData} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test("don't show hidden fields if additionalProperties is false", () => {
        const schema: JSONSchema7 = {
            additionalProperties: false,
          };
          const formData: any = {
              "additionalProperty": 'should not appear'
          }
        const tree = renderer.create(<Form schema={schema} formData={formData} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
});
