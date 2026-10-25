import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, rangeSpec } from '@rjsf/utils';
import { Slider } from 'antd';

import useControlState from '../../controlState.ts';

const decimalsOf = (n: number) => (String(n).split('.')[1] ?? '').length;

/** The value a native range input holds for `value`: clamped to its `min` and `max`, then snapped to the nearest
 * `step` from `min`, the higher one on a tie and the one below when that passes `max`, as the HTML spec sanitizes it
 * (https://html.spec.whatwg.org/multipage/input.html#range-state-(type=range)). The defaults are the native ones
 */
function nativeRangeValue(value: number, min = 0, max = 100, step = 1) {
  const top = Math.max(min, max);
  const steps = Math.round((Math.min(Math.max(value, min), top) - min) / step);
  const snapped = min + steps * step;
  const inRange = snapped > top ? snapped - step : snapped;
  // A decimal step leaves float noise such as 0.30000000000000004, which a browser's decimal arithmetic doesn't
  return Number(inRange.toFixed(Math.max(decimalsOf(min), decimalsOf(step))));
}

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
  const control = useControlState<T, S, F>({ disabled, readonly, registry });

  const { min, max, step } = rangeSpec(schema);
  // An empty value is drawn at `min`, where antd's `Slider` draws an empty one, rather than at a native input's midpoint
  const drawnValue =
    typeof value === 'number' && Number.isFinite(value) ? nativeRangeValue(value, min, max, step) : (min ?? 0);

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
        value={drawnValue}
        {...extraProps}
        // The slider's handle is what takes focus, and it takes no `aria-describedby` or `aria-invalid`, nor a
        // `handleRender` to add them, so it is only named, by the label a `for` can't reach or by the text of one
        // `ui:label: false` hides. It isn't marked required: a slider always holds a value, and ARIA allows no
        // `aria-required` on one
        ariaLabelledByForHandle={ariaLabelledBy}
        ariaLabelForHandle={ariaLabel}
      />
      {/* antd's `Slider` renders no native control, so the value a native submit or `FormData` reads is carried by a
      hidden input. It posts the value the slider is drawn at, as a native range input posts the value its thumb is drawn
      at, and it posts nothing when the slider is drawn disabled */}
      <input type='hidden' name={htmlName || id} value={drawnValue} disabled={control.disabled} />
    </>
  );
}
