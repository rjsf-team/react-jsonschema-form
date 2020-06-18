import React from "react";
import TitleField from "../src/TitleField";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("TitleField", () => {
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
        <TitleField
          uiSchema={{}}
          idSchema={{
            $id: "one",
          }}
          schema={schema}
          required
          title="Hello"
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
          formData={{}}
          errorSchema={{}}
          registry={{
            fields: {},
            widgets: {},
            definitions: {},
            formContext: {},
          }}
          name="name 1"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
