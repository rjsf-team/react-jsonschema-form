import type { FocusEvent } from 'react';
import { useEffect, useRef } from 'react';
import FormLabel from '@mui/material/FormLabel';
import type { SliderProps } from '@mui/material/Slider';
import Slider from '@mui/material/Slider';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getLabelId,
  labelValue,
  rangeSpec,
  widgetDrawsLabel,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the RangeWidget. */
export interface RangeWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the RangeWidget. */
  rjsfSlotProps?: {
    /** Props applied to the MUI `Slider` component. */
    slider?: SliderProps;
  };
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
    value,
    readonly,
    disabled,
    onBlur,
    onFocus,
    options,
    schema,
    onChange,
    required,
    label,
    id,
    htmlName,
    autofocus,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const rootRef = useRef<HTMLSpanElement>(null);
  const isRangeOfValues = Array.isArray(value);
  const focusOnMount = useRef(autofocus && isRangeOfValues);
  // A range of several values focuses its first thumb, as `autoFocus` would one thumb, and like `autoFocus` only on mount,
  // so an `autofocus` that turns true later doesn't take focus from the user
  useEffect(() => {
    if (focusOnMount.current) {
      rootRef.current?.querySelector('input')?.focus();
    }
  }, []);
  const sliderProps = { value, name: htmlName || id, ...rangeSpec<S>(schema) };

  const handleChange: NonNullable<SliderProps['onChange']> = (_, newValue) => onChange(newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RangeWidgetMuiProps>(options);
  // The `Slider` puts a name the form author gives it on the `<input>`, where the `input` slot would replace it, so the
  // plan's name goes in that slot only where the author gives none: the author's choice wins, as on every widget
  const authorSlider: SliderProps = { ...otherMuiProps, ...muiSlotProps?.slider };
  const authorNamesSlider = [
    authorSlider['aria-label'],
    authorSlider['aria-labelledby'],
    authorSlider.getAriaLabel,
  ].some((name) => name !== undefined);
  const {
    'aria-label': plannedLabel,
    'aria-labelledby': plannedLabelledBy,
    ...controlAttributes
  } = getControlAttributes<T, S, F>({ id, presentation });
  // The `Slider` gives its `input` slot to every thumb, so a range of several values keeps the field's id, which only
  // one element may carry, on the slider's root, which a label's `for` can't name. Its label names every thumb through
  // `aria-labelledby` instead
  const labelId = getLabelId<T, S, F>(props);
  const labelledByLabel = isRangeOfValues && widgetDrawsLabelText<T, S, F>(props) ? labelId : undefined;
  const plannedName = authorNamesSlider
    ? {}
    : { 'aria-label': plannedLabel, 'aria-labelledby': plannedLabelledBy ?? labelledByLabel };
  const labelProps = isRangeOfValues ? { id: labelId } : { htmlFor: id };
  const rootProps = isRangeOfValues ? { id } : {};
  const thumbProps = isRangeOfValues ? {} : { id, autoFocus: autofocus };

  return (
    <>
      {labelValue(
        <FormLabel required={required} {...labelProps}>
          {label || undefined}
        </FormLabel>,
        hideLabel,
      )}
      <Slider
        disabled={disabled || readonly}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        valueLabelDisplay='auto'
        {...authorSlider}
        {...sliderProps}
        {...rootProps}
        ref={rootRef}
        // The slider's root isn't focusable but its thumb's `<input>` is, so the input carries the field's id and plan
        slotProps={withInputSlot(
          { ...thumbProps, required, ...controlAttributes, ...plannedName },
          authorSlider.slotProps,
        )}
      />
    </>
  );
}
