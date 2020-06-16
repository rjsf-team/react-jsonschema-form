import React from "react";
import TextWidget from "../src/TextWidget";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("TextWidget", () => {
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
        <TextWidget
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
          type="text"
          formContext={{}}
          id="_id"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
