import React from "react";
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("AdditionalProperties tests", () => {
    test("show add button and fields if additionalProperties is true", () => {
        const schema: JSONSchema7 = {
            additionalProperties: true,
            };
            const formData: any = {
                "additionalProperty": 'should appear'
            }
        const tree = renderer.create(<Form schema={schema} formData={formData} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
