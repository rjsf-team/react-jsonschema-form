import { ChangeEvent, FocusEvent, MouseEvent, useCallback } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { SchemaExamples } from '@rjsf/core';

const TYPES_THAT_SHRINK_LABEL = ['date', 'datetime-local', 'file', 'time'];

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    name, // remove this from textFieldProps
    htmlName,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label,
    hideLabel,
    hideError,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    errorSchema,
    registry,
    InputLabelProps,
    ...textFieldProps
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const { step, min, max, accept, ...rest } = inputProps;
  const htmlInputProps = { step, min, max, accept, ...(schema.examples ? { list: examplesId(id) } : undefined) };
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);
  const DisplayInputLabelProps = TYPES_THAT_SHRINK_LABEL.includes(type)
    ? {
        ...InputLabelProps,
        shrink: true,
      }
    : InputLabelProps;
  const _onClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  return (
    <>
      <TextField
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        label={labelValue(label || undefined, hideLabel, undefined)}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        slotProps={{ htmlInput: htmlInputProps, inputLabel: DisplayInputLabelProps }}
        {...rest}
        value={value || value === 0 ? value : ''}
        error={rawErrors.length > 0}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...(textFieldProps as TextFieldProps)}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
        InputProps={{
          ...textFieldProps.InputProps,
          endAdornment:
            options.allowClearTextInputs && value && !readonly && !disabled ? (
              <InputAdornment position='end'>
                <ClearButton registry={registry} onClick={_onClear} />
              </InputAdornment>
            ) : undefined,
        }}
      />
      <SchemaExamples id={id} schema={schema} />
    </>
  );
}
