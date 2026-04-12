import { ChangeEvent, FocusEvent, MouseEvent, useCallback } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { InputProps as MuiInputProps } from '@mui/material/Input';
import { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
  labelValue,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { SchemaExamples } from '@rjsf/core';
import { getMuiProps } from '../util';

/** Properties available for the MUI `ui:options` of the BaseInputTemplate.
 *  Unlike RJSF templates, `slotProps` here maps directly to MUI's native `TextField` `slotProps`,
 *  enabling type-safe customization of the underlying MUI sub-components. */
export interface BaseInputTemplateMuiProps extends GenericObjectType {
  /** Native MUI `TextField` slotProps for targeting specific sub-components. */
  slotProps?: {
    /** Props applied to the base native HTML `<input>` or `<textarea>` element. */
    htmlInput?: React.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;
    /** Props applied to the MUI `Input` element, useful for `endAdornment`/`startAdornment`. */
    input?: MuiInputProps;
    /** Props applied to the MUI `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
  };
}

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
    InputProps,
    slotProps,
    ...textFieldProps
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const { step, min, max, accept, ...rest } = getInputProps<T, S, F>(schema, type, options);

  const muiProps = getMuiProps<T, S, F, BaseInputTemplateMuiProps>(options);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  const htmlInputProps = {
    ...slotProps?.htmlInput,
    ...muiSlotProps?.htmlInput,
    step,
    min,
    max,
    accept,
    ...(schema.examples ? { list: examplesId(id) } : undefined),
  };
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);
  const DisplayInputLabelProps = TYPES_THAT_SHRINK_LABEL.includes(type)
    ? { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps, shrink: true }
    : { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps };
  const _onClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );
  const inputProps = { ...InputProps, ...slotProps?.input, ...muiSlotProps?.input };
  if (options.allowClearTextInputs && value && !readonly && !disabled) {
    const clearAdornment = (
      <InputAdornment position='end'>
        <ClearButton registry={registry} onClick={_onClear} />
      </InputAdornment>
    );
    inputProps.endAdornment = !inputProps.endAdornment ? (
      clearAdornment
    ) : (
      <>
        {inputProps.endAdornment}
        {clearAdornment}
      </>
    );
  }

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
        slotProps={{
          ...slotProps,
          ...muiSlotProps,
          input: inputProps,
          htmlInput: htmlInputProps,
          inputLabel: DisplayInputLabelProps,
        }}
        {...rest}
        value={value || value === 0 ? value : ''}
        error={rawErrors.length > 0}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...({ ...otherMuiProps, ...textFieldProps } as TextFieldProps)}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      <SchemaExamples id={id} schema={schema} />
    </>
  );
}
