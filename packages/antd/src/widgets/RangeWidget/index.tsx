import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, rangeSpec } from '@rjsf/utils';
import { Slider } from 'antd';

import { fieldDisabled } from '../../utils/index.ts';

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
    options,
    placeholder,
    readonly,
    schema,
    value,
  } = props;
  const { formContext } = registry;

  const { min, max, step } = rangeSpec(schema);

  const emptyValue = options.emptyValue || '';

  const handleChange = (nextValue: any) => onChange(nextValue === '' ? emptyValue : nextValue);

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
      // Leave enabled controls unset so antd can inherit its DisabledContext.
      disabled={fieldDisabled(disabled, readonly, formContext)}
      id={id}
      max={max}
      min={min}
      onChange={!readonly ? handleChange : undefined}
      range={false}
      step={step}
      value={value}
      {...extraProps}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
