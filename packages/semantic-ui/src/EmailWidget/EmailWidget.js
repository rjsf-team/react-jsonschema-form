import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function EmailWidget(props) {
  const {
    id,
    required,
    readonly,
    disabled,
    name,
    label,
    schema,
    uiSchema,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    formContext,
    registry,
  } = props;
  const semanticProps = getSemanticProps({
    schema,
    uiSchema,
    formContext,
    options,
 });
  const { schemaUtils } = registry;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);
  return (
    <Form.Input
      key={id}
      id={id}
      type="email"
      label={displayLabel ? label || schema.title : false}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || value === 0 ? value : ""}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}
export default EmailWidget;
