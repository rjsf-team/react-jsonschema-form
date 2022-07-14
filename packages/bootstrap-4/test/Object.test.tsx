import React from 'react';
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import Form from "../src/index";

describe("object fields", () => {
  test("object", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        a: {type: "string"},
        b: {type: "number"}
      }
    };
    const tree = renderer
      .create(<Form schema={schema} validator={validator} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
