import type { FocusEvent } from 'react';
import FormLabel from '@mui/material/FormLabel';
import type { SliderProps } from '@mui/material/Slider';
import Slider from '@mui/material/Slider';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, labelValue, rangeSpec, widgetDrawsLabel } from '@rjsf/utils';

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
  const sliderProps = { value, name: htmlName || id, ...rangeSpec<S>(schema) };

  const handleChange: NonNullable<SliderProps['onChange']> = (_, newValue) => onChange(newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RangeWidgetMuiProps>(options);
  // The `slotProps` the `Slider` would take from its spread props, the `slider` target's replacing the top-level ones
  const authorSlotProps: SliderProps['slotProps'] = muiSlotProps?.slider?.slotProps ?? otherMuiProps.slotProps;
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
  const plannedName = authorNamesSlider ? {} : { 'aria-label': plannedLabel, 'aria-labelledby': plannedLabelledBy };

  return (
    <>
      {labelValue(
        <FormLabel required={required} htmlFor={id}>
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
        {...otherMuiProps}
        {...muiSlotProps?.slider}
        {...sliderProps}
        // The slider's root isn't focusable but its thumb's `<input>` is, so the input carries the field's id and plan
        slotProps={withInputSlot(
          { id, required, autoFocus: autofocus, ...controlAttributes, ...plannedName },
          authorSlotProps,
        )}
      />
    </>
  );
}
