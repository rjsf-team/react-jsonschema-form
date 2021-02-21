import React from "react";
import TextWidget from "../src/TextWidget";
import renderer from "react-test-renderer";

const noop = () => undefined;
describe("TextWidget", () => {
  const props = {
    schema: {
      type: 'string'
    },
    uiSchema: {},
    formContext: {},
    options: {},
    id: "id",
    label: 'test',
    autofocus: false,
    readonly: false,
    required: false,
    disabled: false,
    multiple: false,
    rawErrors: [""],
    value: "value",
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
  }
  test("schema integer type as string", () => {
    const tree = renderer
      .create(<TextWidget {...props} schema={{ type: "integer" }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
