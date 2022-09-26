import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { Form, CheckboxProps } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    required,
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
    registry,
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
  const { schemaUtils } = registry;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);
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
      label={displayLabel ? label || schema.title : false}
    />
  );
}
export default CheckboxWidget;
