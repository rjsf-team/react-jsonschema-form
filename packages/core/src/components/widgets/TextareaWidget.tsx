import { ChangeEvent, FocusEvent, useCallback } from 'react';
import { ariaDescribedByIds, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
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
}: WidgetProps<T, S, F>) {
  const handleChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) => onChange(value === '' ? options.emptyValue : value),
    [onChange, options.emptyValue]
  );

  const handleBlur = useCallback(
    ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, value),
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, value),
    [id, onFocus]
  );

  return (
    <textarea
      id={id}
      name={id}
      className='form-control'
      value={value ? value : ''}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={options.rows}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}

TextareaWidget.defaultProps = {
  autofocus: false,
  options: {},
};

export default TextareaWidget;
