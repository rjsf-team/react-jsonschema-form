import React, { FocusEvent } from "react";
import { WidgetProps } from "@rjsf/utils";

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<T = any, F = any>({
  id,
  options = {},
  placeholder,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, F>) {
  const handleChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === "" ? options.emptyValue : value);

  const handleBlur = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, value);

  const handleFocus = ({
    target: { value },
  }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <textarea
      id={id}
      className="form-control"
      value={value ? value : ""}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={options.rows}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
    />
  );
}

TextareaWidget.defaultProps = {
  autofocus: false,
  options: {},
};

export default TextareaWidget;
