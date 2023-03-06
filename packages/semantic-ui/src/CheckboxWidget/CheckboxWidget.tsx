import { FormEvent } from "react";
import {
  ariaDescribedByIds,
  schemaRequiresTrueValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { Form, CheckboxProps } from "semantic-ui-react";
import { getSemanticProps } from "../util";

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    formContext,
    schema,
    uiSchema,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    options,
    formContext,
    uiSchema,
    defaultSchemaProps: {
      inverted: false,
    },
  });
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);
  const _onChange = (_: FormEvent<HTMLInputElement>, data: CheckboxProps) =>
    onChange && onChange(data.checked);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const checked = value == "true" || value == true;
  return (
    <Form.Checkbox
      id={id}
      name={id}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      {...semanticProps}
      checked={typeof value === "undefined" ? false : checked}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      required={required}
      label={label || ""}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
