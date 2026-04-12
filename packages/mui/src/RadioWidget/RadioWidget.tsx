import { FocusEvent } from 'react';
import FormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio, { RadioProps } from '@mui/material/Radio';
import RadioGroup, { RadioGroupProps } from '@mui/material/RadioGroup';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  optionId,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
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

  const _onChange = (_: any, value: any) => onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const row = options ? options.inline : false;
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) ?? null;

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
        value={selectedIndex}
        row={row as boolean}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const radio = (
              <FormControlLabel
                {...muiSlotProps?.formControlLabel}
                control={
                  <Radio {...muiSlotProps?.radio} name={htmlName || id} id={optionId(id, index)} color='primary' />
                }
                label={option.label}
                value={String(index)}
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
