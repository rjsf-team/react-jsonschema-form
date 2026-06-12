import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  placeholder,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  htmlName,
}: WidgetProps<T, S, F>) {
  const handleChange = useCallback(
    ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
      onChange(newValue === '' ? options.emptyValue : newValue),
    [onChange, options.emptyValue],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value),
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value),
    [id, onFocus],
  );

  return (
    <textarea
      id={id}
      name={htmlName || id}
      className='form-control'
      value={value || ''}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={options.rows}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}

export default TextareaWidget;
