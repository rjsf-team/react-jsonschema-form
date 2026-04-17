import { ChangeEvent, FocusEvent } from 'react';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormGroup, { FormGroupProps } from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  labelValue,
  optionId,
  FormContextType,
  GenericObjectType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the CheckboxesWidget. */
export interface CheckboxesWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the CheckboxesWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `FormGroup` container. */
    formGroup?: FormGroupProps;
    /** Props applied to the individual `Checkbox` components. */
    checkbox?: CheckboxProps;
    /** Props applied to the `FormControlLabel` components wrapping each checkbox. */
    formControlLabel?: FormControlLabelProps;
  };
}

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    label,
    hideLabel,
    id,
    htmlName,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    required,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        onChange(enumOptionsSelectValue(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue(index, checkboxesValues, enumOptions));
      }
    };

  const _onBlur = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, CheckboxesWidgetMuiProps>(options);

  return (
    <>
      {labelValue(
        <FormLabel required={required} htmlFor={id}>
          {label || undefined}
        </FormLabel>,
        hideLabel,
      )}
      <FormGroup {...otherMuiProps} {...muiSlotProps?.formGroup} id={id} row={!!inline}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index: number) => {
            const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const checkbox = (
              <Checkbox
                {...muiSlotProps?.checkbox}
                id={optionId(id, index)}
                name={htmlName || id}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={_onChange(index)}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={ariaDescribedByIds(id)}
              />
            );
            return (
              <FormControlLabel
                {...muiSlotProps?.formControlLabel}
                control={checkbox}
                key={index}
                label={option.label}
              />
            );
          })}
      </FormGroup>
    </>
  );
}
