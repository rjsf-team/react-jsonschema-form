import { WidgetProps } from "@rjsf/core";
import { JSONSchema7 } from "json-schema";

export const mockSchema: JSONSchema7 = {
  type: "array",
  items: {
    type: "string",
  },
};

export const mockEventHandlers = (): void => void 0;

export function makeWidgetMockProps(
  props: Partial<WidgetProps> = {}
): WidgetProps {
  return {
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
    value: "value",
    options: {},
    formContext: {},
    id: "_id",
    placeholder: "",
    ...props,
  };
}
