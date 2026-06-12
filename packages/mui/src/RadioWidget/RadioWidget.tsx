import type { FocusEvent } from 'react';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import type { RadioProps } from '@mui/material/Radio';
import Radio from '@mui/material/Radio';
import type { RadioGroupProps } from '@mui/material/RadioGroup';
import RadioGroup from '@mui/material/RadioGroup';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
  optionId,
} from '@rjsf/utils';

import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the RadioWidget. */
export interface RadioWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the RadioWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `RadioGroup` component. */
    radioGroup?: RadioGroupProps;
    /** Props applied to the individual `Radio` components. */
    radio?: RadioProps;
    /** Props applied to the `FormControlLabel` components wrapping each radio button. */
    formControlLabel?: FormControlLabelProps;
  };
}

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, htmlName, options, value, required, disabled, readonly, label, hideLabel, onChange, onBlur, onFocus } =
    props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleChange = (_: any, enumValue: any) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, false, optionValueFormat, '');

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RadioWidgetMuiProps>(options);

  return (
    <>
      {labelValue(
        <FormLabel required={required} htmlFor={id}>
          {label || undefined}
        </FormLabel>,
        hideLabel,
      )}
      <RadioGroup
        {...otherMuiProps}
        {...muiSlotProps?.radioGroup}
        id={id}
        name={htmlName || id}
        value={selectValue}
        row={row as boolean}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
            const radio = (
              <FormControlLabel
                {...muiSlotProps?.formControlLabel}
                control={
                  <Radio {...muiSlotProps?.radio} name={htmlName || id} id={optionId(id, index)} color='primary' />
                }
                label={option.label}
                value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                key={String(option.value)}
                disabled={disabled || itemDisabled || readonly}
              />
            );

            return radio;
          })}
      </RadioGroup>
    </>
  );
}
