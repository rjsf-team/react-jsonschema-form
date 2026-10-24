import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, rangeSpec } from '@rjsf/utils';
import { ConfigProvider, Slider } from 'antd';

import getControlState from '../../controlState.ts';

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
    htmlName,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    readonly,
    schema,
    value,
    presentation,
  } = props;
  const control = getControlState<T, S, F>({ disabled, readonly, registry });

  const { min, max, step } = rangeSpec(schema);
  const { componentDisabled } = ConfigProvider.useConfig();
  const postedDisabled = control.disabled ?? (componentDisabled || undefined);

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
    <>
      <Slider
        autoFocus={autofocus}
        disabled={control.disabled}
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
        // `ui:label: false` hides. It isn't marked required: a slider always holds a value, and ARIA allows no
        // `aria-required` on one
        ariaLabelledByForHandle={ariaLabelledBy}
        ariaLabelForHandle={ariaLabel}
      />
      {/* antd's `Slider` renders no native control, so the value a native submit or `FormData` reads is carried by a
      hidden input. With no value it posts the `min` the slider's handle is drawn at, as a native range input posts the
      value its thumb is drawn at, and it posts nothing when the slider is drawn disabled */}
      <input type='hidden' name={htmlName || id} value={value ?? min ?? 0} disabled={postedDisabled} />
    </>
  );
}
