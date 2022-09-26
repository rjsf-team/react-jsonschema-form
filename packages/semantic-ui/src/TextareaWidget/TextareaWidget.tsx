import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function TextareaWidget(props: WidgetProps) {
  const {
    id,
    placeholder,
    value,
    required,
    disabled,
    autofocus,
    label,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    schema,
    uiSchema,
    formContext,
    registry,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps({
    formContext,
    options,
    defaultSchemaProps: { inverted: false },
  });
  const { schemaUtils } = registry;
  // eslint-disable-next-line no-shadow
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);
  return (
    <Form.TextArea
      id={id}
      key={id}
      name={id}
      label={displayLabel ? label || schema.title : false}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      {...semanticProps}
      value={value || ""}
      error={rawErrors.length > 0}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}
export default TextareaWidget;
