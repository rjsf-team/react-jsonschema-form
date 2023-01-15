import React from "react";
import {
  ariaDescribedByIds,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { CheckboxProps, Form, Radio } from "semantic-ui-react";
import { getSemanticProps } from "../util";

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
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
  const semanticProps = getSemanticProps<T, S, F>({
    formContext,
    options,
    uiSchema,
  });
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
              id={optionId<S>(id, option)}
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
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
        })}
    </Form.Group>
  );
}
