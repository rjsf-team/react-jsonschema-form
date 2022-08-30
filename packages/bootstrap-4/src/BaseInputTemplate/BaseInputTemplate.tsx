import React from "react";
import Form from "react-bootstrap/Form";
import { getInputProps, getUiOptions, WidgetProps } from "@rjsf/utils";

const BaseInputTemplate = ({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  rawErrors = [],
  uiSchema,
  children,
  extraProps,
}: WidgetProps) => {
  const inputProps = { ...extraProps, ...getInputProps(schema, type, options) };
  const uiOptions = getUiOptions(uiSchema);
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  // const classNames = [rawErrors.length > 0 ? "is-invalid" : "", type === 'file' ? 'custom-file-label': ""]
  return (
    <Form.Group className="mb-0">
      <Form.Label
        htmlFor={id}
        className={rawErrors.length > 0 ? "text-danger" : ""}
      >
        {uiOptions.title || label || schema.title}
        {(label || uiOptions.title) && required ? "*" : null}
      </Form.Label>
      <Form.Control
        id={id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={rawErrors.length > 0 ? "is-invalid" : ""}
        list={schema.examples ? `examples_${id}` : undefined}
        {...inputProps}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      {children}
      {schema.examples ? (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </Form.Group>
  );
};

export default BaseInputTemplate;
