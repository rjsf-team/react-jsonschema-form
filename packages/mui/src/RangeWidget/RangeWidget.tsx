import { FocusEvent } from 'react';
import FormLabel from '@mui/material/FormLabel';
import Slider, { SliderProps } from '@mui/material/Slider';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  rangeSpec,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

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
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, required, label, hideLabel, id } =
    props;
  const sliderProps = { value, label, id, name: id, ...rangeSpec<S>(schema) };

  const _onChange = (_: any, value?: number | number[]) => {
    onChange(value ?? options.emptyValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RangeWidgetMuiProps>(options);

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
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        valueLabelDisplay='auto'
        {...otherMuiProps}
        {...muiSlotProps?.slider}
        {...sliderProps}
        aria-describedby={ariaDescribedByIds(id)}
      />
    </>
  );
}
