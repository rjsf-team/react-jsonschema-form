import React from "react";
import { WidgetProps, schemaRequiresTrueValue } from "@rjsf/utils";
import { Form, CheckboxProps } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function CheckboxWidget(props: WidgetProps) {
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
  const semanticProps = getSemanticProps({
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
  const required = schemaRequiresTrueValue(schema);
  const _onChange = (
    _: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) => onChange && onChange(data.checked);
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
    />
  );
}
export default CheckboxWidget;
