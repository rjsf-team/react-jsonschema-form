import React from "react";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import { WidgetProps } from "@rjsf/core";
import UpDownWidget from "../src/UpDownWidget/UpDownWidget";

export const mockSchema: JSONSchema7 = {
  type: "array",
  items: {
    type: "string",
  },
};

export const mockEventHandlers = (): void => void 0;

describe("UpDownWidget", () => {
  test("renders 0 as 0 and not ''", () => {
    const props: WidgetProps = {
      uiSchema: {},
      schema: mockSchema,
      required: true,
      disabled: false,
      readonly: true,
      autofocus: true,
      label: "Some simple label",
      onChange: mockEventHandlers,
      onBlur: mockEventHandlers,
      onFocus: mockEventHandlers,
      multiple: false,
      rawErrors: [""],
      options: {},
      formContext: {},
      id: "_id",
      placeholder: "",
      value: 0,
      registry: {
        fields: {},
        widgets: {},
        definitions: {},
        formContext: {},
        rootSchema: {},
      }
    };
    const tree = renderer.create(<UpDownWidget {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
