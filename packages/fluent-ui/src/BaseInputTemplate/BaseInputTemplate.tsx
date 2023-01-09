import React from "react";
import { TextField } from "@fluentui/react";
import { getInputProps, WidgetProps } from "@rjsf/utils";
import _pick from "lodash/pick";

// Keys of ITextFieldProps from @fluentui/react
const allowedProps = [
  "multiline",
  "resizable",
  "autoAdjustHeight",
  "underlined",
  "borderless",
  "label",
  "onRenderLabel",
  "description",
  "onRenderDescription",
  "prefix",
  "suffix",
  "onRenderPrefix",
  "onRenderSuffix",
  "iconProps",
  "defaultValue",
  "value",
  "disabled",
  "readOnly",
  "errorMessage",
  "onChange",
  "onNotifyValidationResult",
  "onGetErrorMessage",
  "deferredValidationTime",
  "className",
  "inputClassName",
  "ariaLabel",
  "validateOnFocusIn",
  "validateOnFocusOut",
  "validateOnLoad",
  "theme",
  "styles",
  "autoComplete",
  "mask",
  "maskChar",
  "maskFormat",
  "type",
  "list",
];

const BaseInputTemplate = ({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  type,
  rawErrors,
  multiline,
}: WidgetProps) => {
  const inputProps = getInputProps(schema, type, options);
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);

  return (
    <>
      <TextField
        id={id}
        name={id}
        placeholder={placeholder}
        label={label || schema.title}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        multiline={multiline}
        // TODO: once fluent-ui supports the name prop, we can add it back in here.
        // name={name}
        {...inputProps}
        value={value || value === 0 ? value : ""}
        onChange={_onChange as any}
        onBlur={_onBlur}
        onFocus={_onFocus}
        errorMessage={(rawErrors || []).join("\n")}
        list={schema.examples ? `examples_${id}` : undefined}
        {...uiProps}
      />
      {schema.examples && (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
};

export default BaseInputTemplate;
