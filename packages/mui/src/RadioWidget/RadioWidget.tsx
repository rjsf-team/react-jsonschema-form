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
  enumOptionSelectedValue,
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getGroupLabelling,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

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
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, options, value, required, disabled, readonly, autofocus, label, onChange, onBlur, onFocus } =
    props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange: NonNullable<RadioGroupProps['onChange']> = (_, enumValue) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat, '');

  const {
    drawsLabel,
    labelId,
    group: groupAttributes,
    option: optionAttributes,
  } = getGroupLabelling<T, S, F>(props, 'radiogroup');

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RadioWidgetMuiProps>(options);
  // `required`, the field's or one the form author gives the `Radio`, which replaces it, goes on the `<input>` rather
  // than the `Radio`, whose `FormControlLabel` would mark each option's label `*`
  const { required: authorRequired, ...radioProps } = muiSlotProps?.radio ?? {};
  const radioSlotProps = withInputSlot(
    { ...optionAttributes, required: authorRequired ?? required },
    radioProps.slotProps,
  );

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
  return (
    <>
      {/* No `for`, which can't name the group's wrapper: the group points its `aria-labelledby` at the label instead */}
      {drawsLabel && (
        <FormLabel id={labelId} required={required}>
          {label}
        </FormLabel>
      )}
      {/* The plan's group attributes go beneath the form author's, as the plan's control attributes do on each radio */}
      <RadioGroup
        {...groupAttributes}
        {...otherMuiProps}
        {...muiSlotProps?.radioGroup}
        id={id}
        name={htmlName || id}
        value={selectValue}
        row={row}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
            const radio = (
              <FormControlLabel
                {...muiSlotProps?.formControlLabel}
                control={
                  <Radio
                    {...radioProps}
                    name={htmlName || id}
                    id={optionId(id, index)}
                    autoFocus={radioProps.autoFocus ?? index === autofocusIndex}
                    color='primary'
                    slotProps={radioSlotProps}
                  />
                }
                label={option.label}
                value={domValues[index]}
                // oxlint-disable-next-line react/no-array-index-key
                key={index}
                disabled={disabled || itemDisabled || readonly}
              />
            );

            return radio;
          })}
      </RadioGroup>
    </>
  );
}
