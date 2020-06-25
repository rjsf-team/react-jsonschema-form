import React from "react";
import ColorWidget from "../src/ColorWidget";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("ColorWidget", () => {
  test("simple", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string",
      },
    };
    const mockHandler = (): void => void 0;
    const tree = renderer
      .create(
        <ColorWidget
          schema={schema}
          required
          disabled={false}
          readonly
          autofocus
          label="Some simple label"
          onChange={mockHandler}
          onBlur={mockHandler}
          onFocus={mockHandler}
          multiple={false}
          rawErrors={[""]}
          value="value"
          options={{}}
          formContext={{}}
          id="_id"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
