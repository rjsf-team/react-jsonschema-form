import React from "react";
import TextareaWidget from "../src/TextareaWidget";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";

describe("TextareaWidget", () => {
  const schema: JSONSchema7 = {
    type: "array",
    items: {
      type: "string",
    },
  };
  const mockHandler = (): void => void 0;
  test("simple without errors", () => {
    const tree = renderer
      .create(
        <TextareaWidget
          placeholder={"SOME PLACEHOLDER"}
          options={{ rows: 5 }}
          onChange={mockHandler}
          onBlur={mockHandler}
          onFocus={mockHandler}
          schema={schema}
          required
          title="Hello"
          disabled={false}
          readonly
          autofocus
          label="Some simple label"
          multiple={false}
          rawErrors={[]}
          value="value"
          type="text"
          formContext={{}}
          id="_id"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("simple with errors", () => {
    const tree = renderer
      .create(
        <TextareaWidget
          placeholder={"SOME PLACEHOLDER"}
          options={{ rows: 5 }}
          onChange={mockHandler}
          onBlur={mockHandler}
          onFocus={mockHandler}
          schema={schema}
          required
          title="Hello"
          disabled={false}
          readonly
          autofocus
          label="Some simple label"
          multiple={false}
          rawErrors={["Invalid 1", "Invalid 2"]}
          value="value"
          type="text"
          formContext={{}}
          id="_id"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test("simple without required", () => {
    const tree = renderer
      .create(
        <TextareaWidget
          placeholder={"SOME PLACEHOLDER"}
          options={{ rows: 5 }}
          onChange={mockHandler}
          onBlur={mockHandler}
          onFocus={mockHandler}
          schema={schema}
          required={false}
          title="Hello"
          disabled={false}
          readonly
          autofocus
          label="Some simple label"
          multiple={false}
          rawErrors={["Invalid 1", "Invalid 2"]}
          value="value"
          type="text"
          formContext={{}}
          id="_id"
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
