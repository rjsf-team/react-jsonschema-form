import * as React from "react";
import { JSONSchema7 } from "json-schema";
import { create } from "react-test-renderer";

import TextWidget from "../src/TextWidget";
import { TextWidgetProps } from "../dist/TextWidget";

describe("TextWidget", () => {
  const mockSchema: JSONSchema7 = {
    type: "array",
    items: {
      type: "string",
    },
  };

  const props: TextWidgetProps = {
    uiSchema: {},
    schema: mockSchema,
    required: true,
    disabled: false,
    readonly: true,
    autofocus: true,
    label: "Some simple label",
    onChange: jest.fn,
    onBlur: jest.fn,
    onFocus: jest.fn,
    multiple: false,
    rawErrors: [""],
    value: "value",
    options: {},
    formContext: {},
    id: "_id",
    placeholder: "",
  };

  it("should render", () => {
    const tree = create(<TextWidget {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders with examples", () => {
    mockSchema.examples = ["Firefox", "Chrome", "Opera", "Vivaldi", "Safari"];

    const tree = create(<TextWidget {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
