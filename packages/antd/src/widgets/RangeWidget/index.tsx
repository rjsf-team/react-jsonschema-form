import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, GenericObjectType } from '@rjsf/utils';
import { getControlAttributes, rangeSpec } from '@rjsf/utils';
import { Slider } from 'antd';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    registry,
    id,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    readonly,
    required,
    schema,
    value,
    presentation,
  } = props;
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const { min, max, step } = rangeSpec(schema);

  const { 'aria-labelledby': ariaLabelledBy, 'aria-label': ariaLabel } = getControlAttributes<T, S, F>({
    id,
    presentation,
  });

  const handleChange = (nextValue: number) => onChange(nextValue);

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    placeholder,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  return (
    <Slider
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      max={max}
      min={min}
      onChange={!readonly ? handleChange : undefined}
      range={false}
      step={step}
      value={value}
      {...extraProps}
      // The slider's handle is what takes focus, and it takes no `aria-describedby` or `aria-invalid`, nor a
      // `handleRender` to add them, so it is only named, by the label a `for` can't reach or by the text of one
      // `ui:label: false` hides, and marked required
      ariaLabelledByForHandle={ariaLabelledBy}
      ariaLabelForHandle={ariaLabel}
      ariaRequired={required}
    />
  );
}
