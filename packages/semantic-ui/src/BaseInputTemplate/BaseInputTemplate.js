/* eslint-disable react/prop-types */
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import { getInputProps } from "@rjsf/utils";

function BaseInputTemplate(props) {
  const {
    id,
    placeholder,
    name,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
    type,
    registry,
    rawErrors = [],
  } = props;
  const inputProps = getInputProps(schema, type, options);
  const semanticProps = getSemanticProps({
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
      placeholder={placeholder}
      {...inputProps}
      label={displayLabel ? label || schema.title : false}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || value === 0 ? value : ""}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}
export default BaseInputTemplate;
