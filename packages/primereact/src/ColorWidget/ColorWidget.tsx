import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, getInputProps } from '@rjsf/utils';
import { ColorPicker } from 'primereact/colorpicker';

/** The `ColorWidget` component renders a color picker.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { inline } = options;
  const primeProps = (options.prime || {}) as object;

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);

  return (
    <ColorPicker
      id={id}
      name={id}
      placeholder={placeholder}
      {...primeProps}
      {...inputProps}
      required={required}
      inline={inline}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      value={value || ''}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
    />
  );
}
