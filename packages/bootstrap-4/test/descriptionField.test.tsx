import React from "react";
import DescriptionField from "../src/DescriptionField";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("DescriptionField", () => {
  const schema: JSONSchema7 = {
    type: "array",
    items: {
      type: "string",
    },
  };
  const mockHandler = (): void => void 0;
  test("should return null when no description as a props is passed", () => {
    const tree = renderer
      .create(
        <DescriptionField
          uiSchema={{}}
          idSchema={{
            $id: "one",
          }}
          formData={{}}
          errorSchema={{}}
          registry={{
            fields: {},
            widgets: {},
            definitions: {},
            formContext: {},
          }}
          name="name 1"
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
    expect(tree).toBe(null);
  });

  test("should return h2 element when description is being passed as props", () => {
    const tree = renderer
      .create(
        <DescriptionField
          uiSchema={{}}
          idSchema={{
            $id: "one",
          }}
          formData={{}}
          errorSchema={{}}
          registry={{
            fields: {},
            widgets: {},
            definitions: {},
            formContext: {},
          }}
          name="name 1"
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
          description="SOME THING"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
