import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { CheckboxProps, Form, Radio } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function RadioWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    schema,
    options,
    formContext,
    uiSchema,
    rawErrors = [],
  } = props;
  const { enumOptions, enumDisabled } = options;
  const semanticProps = getSemanticProps({ formContext, options, uiSchema });
  // eslint-disable-next-line no-shadow
  const _onChange = (
    _: React.FormEvent<HTMLInputElement>,
    { value: eventValue }: CheckboxProps
  ) => {
    return (
      onChange &&
      onChange(schema.type === "boolean" ? eventValue !== "false" : eventValue)
    );
  };
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const inlineOption = options.inline ? { inline: true } : { grouped: true };
  return (
    <Form.Group {...inlineOption}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option) => {
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) !== -1;
          return (
            <Form.Field
              required={required}
              control={Radio}
              id={`${id}-${option.value}`}
              name={id}
              {...semanticProps}
              onFocus={_onFocus}
              onBlur={_onBlur}
              label={`${option.label}`}
              value={`${option.value}`}
              error={rawErrors.length > 0}
              key={option.value}
              checked={value == option.value}
              onChange={_onChange}
              disabled={disabled || itemDisabled || readonly}
            />
          );
        })}
    </Form.Group>
  );
}
export default RadioWidget;
