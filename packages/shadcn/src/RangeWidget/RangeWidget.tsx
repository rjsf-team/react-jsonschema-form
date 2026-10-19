import type { KeyboardEvent } from 'react';
import { useEffect, useRef } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors, rangeSpec } from '@rjsf/utils';

import type { SliderProps } from '../components/ui/slider.tsx';
import { Slider } from '../components/ui/slider.tsx';
import { cn } from '../lib/utils.ts';

// The keys Radix moves a thumb by
const SLIDER_KEYS = new Set(['Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const allowedProps = [
  'name',
  'min',
  'max',
  'step',
  'orientation',
  'disabled',
  'defaultValue',
  'value',
  'onValueChange',
  'className',
  'dir',
  'inverted',
  'minStepsBetweenThumbs',
];

/**
 * A range widget component that renders a slider for number input. The slider's thumb, the element a user focuses,
 * carries the field's id and plan
 * @param {object} props - The widget properties
 * @param {number} props.value - The current value of the range
 * @param {boolean} props.readonly - Whether the widget is read-only
 * @param {boolean} props.disabled - Whether the widget is disabled
 * @param {object} props.options - Additional options for the widget
 * @param props.schema - The JSON schema for this field
 * @param {(value: any) => void} props.onChange - Callback for when the value changes
 * @param props.onBlur - Callback for when the thumb loses focus
 * @param props.onFocus - Callback for when the thumb gains focus
 * @param {string} props.id - The unique identifier for the widget
 * @returns {JSX.Element} The rendered range widget
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    value,
    readonly,
    disabled,
    autofocus,
    options,
    schema,
    onChange,
    onBlur,
    onFocus,
    id,
    htmlName,
    presentation,
  } = props;
  const thumbRef = useRef<HTMLSpanElement>(null);
  // React focuses a form control or button marked `autoFocus` as it mounts, but not the thumb, which is a <span>. Radix
  // draws the thumb `display: none` until a render after it mounts, which this effect runs before, and a browser focuses
  // no element drawn so, so the thumb is focused once that render is done. Like `autoFocus`, it acts only on mount, so
  // an `autofocus` that turns true later doesn't take focus from wherever the user is
  const autofocusOnMount = useRef(autofocus);
  useEffect(() => {
    let cancelled = false;
    if (autofocusOnMount.current) {
      queueMicrotask(() => {
        if (!cancelled) {
          thumbRef.current?.focus();
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);
  const optionProps = new Map(Object.entries(options.props ?? {}));
  // The empty-range handling below decides the slider's name, disabled state and value changes, so those that
  // `ui:options.props` gives are folded into it rather than spread over it
  const sliderOptionProps: Partial<SliderProps> = Object.fromEntries(
    allowedProps.filter((key) => optionProps.has(key)).map((key) => [key, optionProps.get(key)]),
  );
  const { name: uiName, disabled: uiDisabled, onValueChange: uiOnValueChange, ...uiProps } = sliderOptionProps;
  const sliderDisabled = uiDisabled ?? (disabled || readonly);
  const formName = uiName ?? (htmlName || id);
  const spec = rangeSpec<S>(schema);
  // A `min` from `ui:options.props` replaces the schema's on the slider, so an empty range's thumb is drawn there
  const min: number = typeof uiProps.min === 'number' ? uiProps.min : (spec.min ?? 0);
  const { max, step } = spec;
  const isEmpty = value === undefined || value === null;
  // Radix reports only a value that changes, and an empty range draws its thumb at its minimum, so a press or a key
  // that leaves the thumb there commits the minimum itself, as moving a native range's thumb to its minimum would.
  // Only one that began on the slider does, so a release dragged in from elsewhere commits nothing
  const pendingRef = useRef(false);
  // Radix restores the value the slider first rendered on its form's reset, which for a range that started empty is the
  // minimum its thumb is drawn at, so that restore empties the range instead
  const startedEmpty = useRef(isEmpty);
  const resettingRef = useRef(false);
  useEffect(() => {
    const thumb = thumbRef.current;
    const ownerDocument = startedEmpty.current ? thumb?.ownerDocument : undefined;
    // Radix listens for the reset on the form itself, so it is caught here on its way down, before Radix restores
    const handleReset = ({ target }: Event) => {
      if (target instanceof HTMLFormElement && target.contains(thumb)) {
        resettingRef.current = true;
        setTimeout(() => {
          resettingRef.current = false;
        });
      }
    };
    ownerDocument?.addEventListener('reset', handleReset, true);
    return () => ownerDocument?.removeEventListener('reset', handleReset, true);
  }, []);
  const handleChange = (newValue: number[]) => {
    pendingRef.current = false;
    uiOnValueChange?.(newValue);
    if (resettingRef.current) {
      resettingRef.current = false;
      onChange(undefined);
      return;
    }
    onChange(newValue[0]);
  };
  const startInteraction = () => {
    pendingRef.current = true;
  };
  // A press that is cancelled or loses its capture, or a key held as focus leaves, never ends on the slider, so a later
  // release there doesn't commit the minimum for it
  const cancelInteraction = () => {
    pendingRef.current = false;
  };
  const commitMinimum = () => {
    if (pendingRef.current && isEmpty && !sliderDisabled) {
      onChange(min);
    }
    pendingRef.current = false;
  };
  const handleKeyDown = ({ key }: KeyboardEvent<HTMLSpanElement>) => {
    if (SLIDER_KEYS.has(key)) {
      startInteraction();
    }
  };
  const handleKeyUp = ({ key }: KeyboardEvent<HTMLSpanElement>) => {
    if (SLIDER_KEYS.has(key)) {
      commitMinimum();
    }
  };
  const handleBlur = () => {
    cancelInteraction();
    onBlur(id, value);
  };
  const handleFocus = () => onFocus(id, value);
  return (
    <>
      <Slider
        // Radix hides the thumb of a slider with no value, which leaves the field nothing to focus, so an empty range
        // draws its thumb at its minimum. Its hidden input would submit that minimum under the field's name, so an
        // empty range names none
        name={isEmpty ? undefined : formName}
        disabled={sliderDisabled}
        min={min}
        max={max}
        step={step}
        value={[isEmpty ? min : (value as number)]}
        {...uiProps}
        onValueChange={handleChange}
        onPointerDown={startInteraction}
        onPointerUp={commitMinimum}
        onPointerCancel={cancelInteraction}
        onLostPointerCapture={cancelInteraction}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        thumbProps={{
          id,
          ref: thumbRef,
          onBlur: handleBlur,
          onFocus: handleFocus,
          ...getControlAttributes<T, S, F>({ id, presentation }),
          className: cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }),
        }}
      />
      {value}
    </>
  );
}
