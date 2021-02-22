import React from "react";
import TextWidget from "../src/TextWidget";
import renderer from "react-test-renderer";

const noop = () => undefined;
describe("TextWidget", () => {
  const props = {
    uiSchema: {},
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    label: 'test',
    disabled: false,
    rawErrors: [""],
    value: "value",
    options: {},
    formContext: {},
    id: "id",
  };
  test("schema integer type as string", () => {
    const tree = renderer
      .create(<TextWidget {...props} schema={{ type: 'integer' }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
