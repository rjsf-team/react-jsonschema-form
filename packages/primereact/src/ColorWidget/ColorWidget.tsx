import React, { FunctionComponent } from "react";
import { WidgetProps } from "@rjsf/core";
import { ColorPicker, ColorPickerChangeParams } from "primereact/colorpicker";
import cn from "clsx";

const ColorWidget: FunctionComponent<WidgetProps> = ({
  id,
  label,
  value,
  disabled,
  required,
  readonly,
  options,
  onChange,
  onBlur,
  onFocus,
  schema,
  rawErrors = [],
  uiSchema,
}) => {
  const _onChange = ({ value }: ColorPickerChangeParams) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);
  const labelValue = uiSchema["ui:title"] || schema.title || label;

  return (
    <div>
      {labelValue && (
        <label htmlFor={id} className={cn("block mb-1", rawErrors.length > 0 && "text-color-danger")}>
          {labelValue}
          {required ? "*" : null}
        </label>
      )}
      <ColorPicker
        inputId={id}
        value={value || ""}
        disabled={disabled}
        required={required}
        readOnly={readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </div>
  );
};

export default ColorWidget;
