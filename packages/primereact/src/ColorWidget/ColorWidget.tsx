import { ChangeEvent } from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
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

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

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
      onChange={onChangeOverride || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
    />
  );
}
