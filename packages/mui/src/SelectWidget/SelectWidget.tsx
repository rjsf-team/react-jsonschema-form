import type { ChangeEvent, FocusEvent } from 'react';
import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps as MuiSelectProps } from '@mui/material/Select';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
} from '@rjsf/utils';

import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the SelectWidget. */
export interface SelectWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the SelectWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the `Select` element. */
    select?: MuiSelectProps;
  };
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    schema,
    id,
    name, // remove this from textFieldProps
    htmlName,
    options,
    label,
    hideLabel,
    required,
    disabled,
    placeholder,
    readonly,
    value,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    errorSchema,
    rawErrors = [],
    registry,
    uiSchema,
    hideError,
    ...textFieldProps
  } = props;
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const isMultiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = isMultiple ? [] : '';
  const isEmpty =
    typeof value === 'undefined' || (isMultiple && value.length < 1) || (!isMultiple && value === emptyValue);

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<{ value: string }>) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));
  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, SelectWidgetMuiProps>(options);

  const { InputLabelProps, SelectProps, autocomplete, ...textFieldRemainingProps } = textFieldProps;
  const showPlaceholderOption = !isMultiple && schema.default === undefined;

  return (
    <TextField
      id={id}
      name={htmlName || id}
      label={labelValue(label || undefined, hideLabel, undefined)}
      value={enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, emptyValue)}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      autoComplete={autocomplete}
      placeholder={placeholder}
      error={rawErrors.length > 0}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...({ ...otherMuiProps, ...textFieldRemainingProps } as TextFieldProps)}
      select // Apply this and the following props after the potential overrides defined in textFieldProps
      slotProps={{
        ...muiSlotProps,
        inputLabel: {
          ...muiSlotProps?.inputLabel,
          shrink: !isEmpty,
        },
        select: {
          ...muiSlotProps?.select,
          multiple,
        },
      }}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <MenuItem value=''>{placeholder}</MenuItem>}
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: enumValue, label: enumLabel }, i: number) => {
          const isDisabled: boolean = Array.isArray(enumDisabled) && enumDisabled.includes(enumValue);
          return (
            <MenuItem
              key={String(enumValue)}
              value={enumOptionValueEncoder(enumValue, i, optionValueFormat)}
              disabled={isDisabled}
            >
              {enumLabel}
            </MenuItem>
          );
        })}
    </TextField>
  );
}
