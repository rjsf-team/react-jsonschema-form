import { useCallback } from 'react';
import type {
  __BaseInputProps,
  BoxProps,
  ElementProps,
  InputFactory,
  InputProps,
  InputWrapperFactory,
  InputWrapperProps,
  SliderProps,
  StylesApiProps,
} from '@mantine/core';
import { Slider, Input, useProps } from '@mantine/core';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, rangeSpec, titleId, widgetDrawsLabel } from '@rjsf/utils';

import type { OwnKeys } from '../utils.tsx';
import { cleanupOptions, getOwnLabel, useFieldWrapperProps, useHiddenTitle, useShownSuccessId } from '../utils.tsx';

/** The Mantine input and `InputWrapper` props `Slider` doesn't take, which it would pass on to its root element as
 * unknown attributes
 */
type SliderExcludedKey = Exclude<
  | keyof __BaseInputProps
  | OwnKeys<InputProps, BoxProps & StylesApiProps<InputFactory>>
  | OwnKeys<InputWrapperProps, BoxProps & StylesApiProps<InputWrapperFactory> & ElementProps<'div'>>,
  keyof SliderProps | `__${string}`
>;

// A record, not a list, so that a prop a later Mantine release adds fails typecheck until it is listed here
const sliderExcludedKeyRecord: Record<SliderExcludedKey, true> = {
  description: true,
  descriptionProps: true,
  error: true,
  errorProps: true,
  inputContainer: true,
  inputSize: true,
  inputWrapperOrder: true,
  labelElement: true,
  labelProps: true,
  leftSection: true,
  leftSectionPointerEvents: true,
  leftSectionProps: true,
  leftSectionWidth: true,
  loading: true,
  loadingPosition: true,
  multiline: true,
  pointer: true,
  required: true,
  rightSection: true,
  rightSectionPointerEvents: true,
  rightSectionProps: true,
  rightSectionWidth: true,
  rootRef: true,
  success: true,
  successProps: true,
  withAria: true,
  withAsterisk: true,
  withErrorStyles: true,
  withSuccessStyles: true,
  wrapperProps: true,
};
const sliderExcludedKeys = new Set(Object.keys(sliderExcludedKeyRecord));

interface FieldSliderProps extends Omit<SliderProps, 'thumbProps'> {
  id: string;
  /** The ids its field's plan describes the thumb by */
  describedBy?: string;
  /** The label its field's plan names the thumb by, one drawn elsewhere, as by the template */
  labelledBy?: string;
  // Mantine's `Thumb` also reads a `thumbLabel` from it, which `SliderProps` doesn't type
  thumbProps?: GenericObjectType;
  successId: string;
  invalid: boolean;
}

/** A `Slider` whose focusable thumb carries the field's id, is named by the field's label and is described by its ids,
 * including the success message of the `Input.Wrapper` it is rendered in while Mantine renders it. Every other prop,
 * including the ref and handlers a single-child `inputContainer` such as `Tooltip` adds, is passed on to the `Slider`.
 */
function FieldSlider({
  id,
  describedBy,
  labelledBy,
  successId,
  invalid,
  thumbProps,
  thumbLabel,
  ...props
}: FieldSliderProps) {
  const shownSuccessId = useShownSuccessId(successId);
  // A `thumbLabel` key in `thumbProps` replaces the prop, even when `undefined`, since Mantine spreads `thumbProps` last
  const namedByThumbLabel = thumbProps && 'thumbLabel' in thumbProps ? thumbProps.thumbLabel : thumbLabel;
  return (
    <Slider
      thumbLabel={thumbLabel}
      {...props}
      thumbProps={{
        ...thumbProps,
        // On the thumb, the element a user focuses, rather than on the root, where Mantine puts an `id`, so
        // `focusOnFirstError` reaches it rather than the hidden input named after the field
        id,
        'aria-describedby':
          [describedBy, shownSuccessId, thumbProps?.['aria-describedby']].filter(Boolean).join(' ') || undefined,
        'aria-invalid': thumbProps?.['aria-invalid'] ?? (invalid || undefined),
        // Mantine names the thumb by `thumbLabel` through `aria-label`, which `aria-labelledby` would override in turn,
        // whichever label it points at
        'aria-labelledby': thumbProps?.['aria-labelledby'] ?? (namedByThumbLabel ? undefined : labelledBy),
      }}
    />
  );
}

/** The `RangeWidget` component renders a Mantine `Slider` inside `Input.Wrapper`, which renders the field's title,
 * description and errors.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, value, disabled, readonly, autofocus, options, onChange, onBlur, onFocus, schema } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const label = getOwnLabel<T, S, F>(props);

  const themeProps = cleanupOptions(options, sliderExcludedKeys);
  const { min, max, step } = rangeSpec(schema);
  const { wrapperProps, inputWrapperOrder, invalid, successId, slotlessErrors } = useFieldWrapperProps(props);
  const { 'aria-labelledby': labelledBy, 'aria-describedby': describedBy } = getControlAttributes<T, S, F>(props);
  // The slider is named by `titleId(id)`, so the title is kept, hidden, when Mantine doesn't render it
  const hiddenTitle = useHiddenTitle(id, label, hideLabel, inputWrapperOrder);
  const { thumbProps, thumbLabel } = useProps<GenericObjectType>(
    'Slider',
    {},
    { thumbProps: options.thumbProps, thumbLabel: options.thumbLabel },
  );

  const handleChange = useCallback(
    (nextValue: number) => {
      if (!disabled && !readonly && onChange) {
        onChange(nextValue);
      }
    },
    [onChange, disabled, readonly],
  );

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  return (
    <>
      {hiddenTitle}
      <Input.Wrapper {...wrapperProps}>
        <FieldSlider
          id={id}
          describedBy={describedBy}
          labelledBy={labelledBy ?? (label ? titleId(id) : undefined)}
          name={htmlName || id}
          value={value}
          max={max}
          min={min}
          step={step}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...themeProps}
          successId={successId}
          invalid={invalid}
          thumbProps={thumbProps}
          thumbLabel={thumbLabel}
        />
      </Input.Wrapper>
      {slotlessErrors}
    </>
  );
}
