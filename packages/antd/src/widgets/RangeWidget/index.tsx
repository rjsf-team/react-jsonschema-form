import { useLayoutEffect, useRef } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, rangeSpec } from '@rjsf/utils';
import { Slider } from 'antd';

import useControlState from '../../controlState.ts';

// `String()` writes a number below 1e-6 with an exponent, such as `1e-7`, whose decimals the exponent counts
const decimalsOf = (n: number) => {
  const [mantissa, exponent = '0'] = String(n).split('e');
  return Math.max(0, (mantissa.split('.')[1] ?? '').length - Number(exponent));
};

/** The value a native range input holds for `value`: clamped to its `min` and `max`, then snapped to the nearest
 * `step` from `min`, the higher one on a tie and the one below when that passes `max`, as the HTML spec sanitizes it
 * (https://html.spec.whatwg.org/multipage/input.html#range-state-(type=range)). The defaults are the native ones
 */
function nativeRangeValue(value: number, min = 0, max = 100, step = 1) {
  const top = Math.max(min, max);
  // A decimal step leaves float noise, such as 3.4999999999999996 steps for 0.35 over 0.1 or a snapped value of
  // 0.30000000000000004, which a browser's decimal arithmetic doesn't. It is rounded away before the tie is broken and
  // before the snapped value is compared with `max`. `toFixed()` takes at most 100 digits
  const quotient = (Math.min(Math.max(value, min), top) - min) / step;
  const steps = Math.round(Number(quotient.toPrecision(15)));
  const precision = Math.min(100, Math.max(decimalsOf(min), decimalsOf(step)));
  const round = (n: number) => Number(n.toFixed(precision));
  const snapped = round(min + steps * step);
  return snapped > top ? round(snapped - step) : snapped;
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

  const {
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  } = getControlAttributes<T, S, F>({ id, presentation });

  // antd's `Slider` drops `aria-describedby` and `aria-invalid` and takes no handle props for them, so they're written
  // onto its handle; the hidden input after the slider's root finds the handle in this widget alone. The handle's
  // tooltip rewrites `aria-describedby` to its own id as it opens and removes it as it closes, without this widget
  // rendering, so the field's ids are written back in front of whatever ids the tooltip leaves.
  // shortcut: pass `aria-describedby` as `ariaDescribedByForHandle` once antd ships `@rc-component/slider` 1.2 (#5560)
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const writtenIdsRef = useRef<string[]>([]);
  useLayoutEffect(() => {
    const handle = hiddenInputRef.current?.previousElementSibling?.querySelector('[role="slider"]');
    if (!handle) {
      return undefined;
    }
    if (ariaInvalid) {
      handle.setAttribute('aria-invalid', 'true');
    } else {
      handle.removeAttribute('aria-invalid');
    }
    const fieldIds = ariaDescribedBy?.split(' ') ?? [];
    const describe = () => {
      const current = handle.getAttribute('aria-describedby') ?? '';
      const otherIds = current
        .split(' ')
        .filter((describedById) => describedById && !writtenIdsRef.current.includes(describedById));
      writtenIdsRef.current = fieldIds;
      const describedBy = [...fieldIds, ...otherIds].join(' ');
      if (!describedBy) {
        handle.removeAttribute('aria-describedby');
      } else if (current !== describedBy) {
        handle.setAttribute('aria-describedby', describedBy);
      }
    };
    describe();
    const observer = new MutationObserver(describe);
    observer.observe(handle, { attributeFilter: ['aria-describedby'] });
    return () => observer.disconnect();
  }, [ariaDescribedBy, ariaInvalid]);

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
        // The slider's handle is what takes focus, so it is named here, by the label a `for` can't reach or by the
        // text of one `ui:label: false` hides. It isn't marked required: a slider always holds a value, and ARIA allows
        // no `aria-required` on one
        ariaLabelledByForHandle={ariaLabelledBy}
        ariaLabelForHandle={ariaLabel}
      />
      {/* antd's `Slider` renders no native control, so the value a native submit or `FormData` reads is carried by a
      hidden input. It posts the value the slider is drawn at, as a native range input posts the value its thumb is drawn
      at, and it posts nothing when the slider is drawn disabled */}
      <input ref={hiddenInputRef} type='hidden' name={htmlName || id} value={drawnValue} disabled={control.disabled} />
    </>
  );
}
