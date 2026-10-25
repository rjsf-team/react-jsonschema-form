import type { ChangeEvent } from 'react';
import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps as MuiSelectProps } from '@mui/material/Select';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import type {
  FormContextType,
  GenericObjectType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getControlAriaLabel,
  getOptionValueFormat,
  groupEnumOptions,
  hasWidgetErrors,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { describeByHelperText, getMuiProps, helperTextSlot, withSlotProps } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the SelectWidget. */
export interface SelectWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the SelectWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the `Select` element. */
    select?: MuiSelectProps;
    /** Props applied to the element with the `combobox` role, as an object or as MUI's `(ownerState) => props`. */
    htmlInput?: NonNullable<TextFieldProps['slotProps']>['htmlInput'];
    /** Props applied to the helper text, as an object or as MUI's `(ownerState) => props`. */
    formHelperText?: NonNullable<TextFieldProps['slotProps']>['formHelperText'];
  };
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    name, // remove this from textFieldProps
    htmlName,
    options,
    label,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    hideLabel: _hideLabel,
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
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    rawErrors: _rawErrors,
    registry,
    uiSchema,
    hideError: _hideError,
    // Given to the combobox below, so kept off the field's root, where `textFieldProps` are spread
    'aria-label': _ariaLabel,
    'aria-describedby': _ariaDescribedBy,
    presentation: _presentation,
    ...textFieldProps
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const isMultiple = multiple ?? false;

  const emptyValue = isMultiple ? [] : '';
  const isEmpty =
    typeof value === 'undefined' || (isMultiple && value.length < 1) || (!isMultiple && value === emptyValue);

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<{ value: string }>) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
  // MUI's select focuses a `div` with no value of its own
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(props);
  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, SelectWidgetMuiProps>(options);

  const { InputLabelProps, SelectProps, autocomplete, ...textFieldRemainingProps } = textFieldProps;
  // MUI's select gives its `inputProps` to the element with the `combobox` role, rather than to the field's root. An
  // `htmlInput` given through `rjsfSlotProps` is the form author's own choice for that element, so it is applied last
  const textFieldOverrides = { ...otherMuiProps, ...textFieldRemainingProps } as TextFieldProps;
  const ariaProps = describeByHelperText(
    widgetAriaProps(props),
    textFieldOverrides.id ?? id,
    textFieldOverrides.helperText,
  );
  // The combobox shows its value, not a name, so where no label names it, it is named by the field's label, its
  // placeholder or the translated prompt
  const ariaLabel = getControlAriaLabel<T, S, F>(props, ariaProps['aria-label'], widgetDrawsLabelText<T, S, F>(props));
  const showPlaceholderOption = !isMultiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, isMultiple);

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <MenuItem key={option.index} value={domValues[option.index]} disabled={option.disabled}>
        {option.label}
      </MenuItem>
    );
  }

  return (
    <>
      <TextField
        id={id}
        name={htmlName || id}
        label={labelValue(label || undefined, hideLabel, undefined)}
        value={enumOptionSelectedValue(value, enumOptions, isMultiple, optionValueFormat, emptyValue)}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        autoComplete={autocomplete}
        placeholder={placeholder}
        error={hasWidgetErrors<T, S, F>(props)}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...textFieldOverrides}
        select // Apply this and the following props after the potential overrides defined in textFieldProps
        slotProps={{
          ...muiSlotProps,
          inputLabel: {
            ...muiSlotProps?.inputLabel,
            shrink: !isEmpty,
          },
          select: {
            // MUI names the combobox by the `labelId` of its select, and gives an `aria-labelledby` among its
            // `inputProps` to the hidden native input instead, so a label the plan names it by goes there
            ...(ariaProps['aria-labelledby'] && { labelId: ariaProps['aria-labelledby'] }),
            ...muiSlotProps?.select,
            multiple,
          },
          htmlInput: withSlotProps({ ...ariaProps, 'aria-label': ariaLabel }, muiSlotProps?.htmlInput),
          formHelperText: helperTextSlot(textFieldOverrides.id ?? id, muiSlotProps?.formHelperText),
        }}
      >
        {showPlaceholderOption && <MenuItem value=''>{placeholder}</MenuItem>}
        {groupEnumOptions<S>(enumOptions, optgroups, enumDisabled).flatMap((item) =>
          isEnumOptionsGroup<S>(item)
            ? [
                // MUI's `SelectInput` clones every direct child with `role='option'` and has no group primitive, so a
                // heading can't be exposed as a `role='group'` label the way a native `<optgroup>` is. `aria-disabled`
                // is the closest available: the label is still announced, but not as something selectable (clicking it
                // is already a no-op, since `handleItemClick` bails on the missing `tabindex`).
                <ListSubheader key={`optgroup-${item.label}`} aria-disabled>
                  {item.label}
                </ListSubheader>,
                ...item.options.map(renderOption),
              ]
            : [renderOption(item)],
        )}
      </TextField>
      <SelectedOptionDescription {...props} />
    </>
  );
}
