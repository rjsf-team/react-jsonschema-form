import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import type { InputProps as MuiInputProps } from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import type { TextFieldOwnerState, TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import { SchemaExamples } from '@rjsf/core';
import type {
  BaseInputTemplateProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  examplesId,
  getControlAttributes,
  getExampleSuggestions,
  getInputProps,
  getNumericInputTitle,
  hasWidgetErrors,
  labelValue,
  widgetDrawsLabel,
} from '@rjsf/utils';

import type { MuiSlotProps } from '../util.ts';
import { describeByHelperText, getMuiProps, helperTextSlot, inputLabelId, resolveSlotProps } from '../util.ts';

type HtmlInputAttributes = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;

/** Properties available for the MUI `ui:options` of the BaseInputTemplate.
 *  Unlike RJSF templates, `slotProps` here maps directly to MUI's native `TextField` `slotProps`,
 *  enabling type-safe customization of the underlying MUI sub-components. */
export interface BaseInputTemplateMuiProps extends GenericObjectType {
  /** Native MUI `TextField` slotProps for targeting specific sub-components. */
  slotProps?: {
    /** Props applied to the base native HTML `<input>` or `<textarea>` element, as an object or as MUI's
     * `(ownerState) => props` */
    htmlInput?: MuiSlotProps<HtmlInputAttributes, TextFieldOwnerState>;
    /** Props applied to the MUI `Input` element, useful for `endAdornment`/`startAdornment`. */
    input?: MuiInputProps;
    /** Props applied to the MUI `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the helper text, as an object or as MUI's `(ownerState) => props`. */
    formHelperText?: MuiSlotProps<FormHelperTextProps, TextFieldOwnerState>;
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    hideLabel: _hideLabel,
    hideError: _hideError,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    rawErrors: _rawErrors,
    errorSchema,
    registry,
    InputLabelProps,
    InputProps,
    slotProps,
    presentation,
    ...textFieldProps
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const derivedInputProps = getInputProps<T, S, F>(schema, type, options);
  const { step, min, max, accept, inputMode, pattern, autoCapitalize, ...rest } = derivedInputProps;

  const muiProps = getMuiProps<T, S, F, BaseInputTemplateMuiProps>(options);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  const textFieldOverrides = { ...otherMuiProps, ...textFieldProps } as TextFieldProps;
  const controlAttributes = describeByHelperText(
    getControlAttributes<T, S, F>({ id, presentation }, hasExamples ? [examplesId(id)] : []),
    textFieldOverrides.id ?? id,
    textFieldOverrides.helperText,
  );
  const numericTitle = getNumericInputTitle(derivedInputProps, registry.translateString);
  // The derived attributes and the field's plan come first so a caller's `slotProps.htmlInput` overrides any of them.
  // The plan goes on the `<input>` a user focuses rather than on the `TextField`'s root, where its own props go. The
  // title explains the derived `pattern`, so a caller replacing that pattern drops it rather than describing a rule no
  // longer in force. A caller may give `htmlInput` as MUI's `(ownerState) => props`, so the slot is handed on in that
  // form, for MUI to resolve
  const htmlInputProps = (ownerState: TextFieldOwnerState) => {
    const callerHtmlInput = {
      ...resolveSlotProps<HtmlInputAttributes, TextFieldOwnerState>(slotProps?.htmlInput, ownerState),
      ...resolveSlotProps(muiSlotProps?.htmlInput, ownerState),
    };
    return {
      title: 'pattern' in callerHtmlInput ? undefined : numericTitle,
      step,
      min,
      max,
      accept,
      inputMode,
      pattern,
      autoCapitalize,
      ...controlAttributes,
      ...callerHtmlInput,
      ...(hasExamples ? { list: examplesId(id) } : undefined),
    };
  };
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);
  const DisplayInputLabelProps = TYPES_THAT_SHRINK_LABEL.includes(type)
    ? { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps, shrink: true }
    : { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps };
  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue);
    },
    [onChange, options.emptyValue],
  );
  const inputProps = { ...InputProps, ...slotProps?.input, ...muiSlotProps?.input };
  if (options.allowClearTextInputs && value && !readonly && !disabled) {
    const clearAdornment = (
      <InputAdornment position='end'>
        <ClearButton registry={registry} onClick={handleClear} />
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
          inputLabel: { ...DisplayInputLabelProps, id: inputLabelId(textFieldOverrides.id ?? id) },
          formHelperText: helperTextSlot<FormHelperTextProps, TextFieldOwnerState>(
            textFieldOverrides.id ?? id,
            slotProps?.formHelperText,
            muiSlotProps?.formHelperText,
          ),
        }}
        {...rest}
        value={value || value === 0 ? value : ''}
        error={hasWidgetErrors<T, S, F>(props)}
        onChange={onChangeOverride ?? handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...textFieldOverrides}
      />
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
