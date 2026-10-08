import type { ChangeEvent } from 'react';
import type { CheckboxProps } from '@mui/material/Checkbox';
import Checkbox from '@mui/material/Checkbox';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormGroupProps } from '@mui/material/FormGroup';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import type { FormContextType, GenericObjectType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  labelValue,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { getMuiProps } from '../util.ts';

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
  const { enumOptions, enumDisabled, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        onChange(enumOptionsSelectValue(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue(index, checkboxesValues, enumOptions));
      }
    };

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

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
            const itemDisabled =
              Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value);
            const checkbox = (
              <Checkbox
                {...muiSlotProps?.checkbox}
                id={optionId(id, index)}
                name={htmlName || id}
                checked={checked}
                value={domValues[index]}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange(index)}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                aria-describedby={ariaDescribedByIds(id)}
              />
            );
            return (
              <FormControlLabel
                {...muiSlotProps?.formControlLabel}
                control={checkbox}
                // oxlint-disable-next-line react/no-array-index-key
                key={index}
                label={option.label}
              />
            );
          })}
      </FormGroup>
    </>
  );
}
