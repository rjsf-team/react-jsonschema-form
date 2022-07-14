/** @jsx jsx */
import { jsx } from "@emotion/react";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv6";
import renderer from "react-test-renderer";

import Form from "../src/index";

describe("object fields", () => {
  test("object", () => {
    const schema: RJSFSchema = {
      type: "object",
      properties: {
        a: { type: "string", title: "A" },
        b: { type: "number", title: "B" },
      },
    };
    const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
