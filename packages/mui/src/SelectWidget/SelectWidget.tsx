import type { ChangeEvent } from 'react';
import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps as MuiSelectProps } from '@mui/material/Select';
import type { TextFieldOwnerState, TextFieldProps } from '@mui/material/TextField';
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
  templateMarksRequired,
} from '@rjsf/utils';

import {
  describeByHelperText,
  getMuiProps,
  helperTextSlot,
  inputLabelId,
  omitFormOwnedProps,
  omitKeys,
  resolveSlotProps,
  withoutDisabled,
} from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the SelectWidget. */
export interface SelectWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the SelectWidget. */
  rjsfSlotProps?: {
    /** Props applied to the field's root `FormControl`, as an object or as MUI's `(ownerState) => props`. */
    root?: NonNullable<TextFieldProps['slotProps']>['root'];
    /** Props applied to the `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the `Select` element. */
    select?: MuiSelectProps;
    /** Props applied to the select's outlined input, as an object or as MUI's `(ownerState) => props`. */
    input?: NonNullable<TextFieldProps['slotProps']>['input'];
    /** Props applied to the element with the `combobox` role, as an object or as MUI's `(ownerState) => props`. */
    htmlInput?: NonNullable<TextFieldProps['slotProps']>['htmlInput'];
    /** Props applied to the helper text, as an object or as MUI's `(ownerState) => props`. */
    formHelperText?: NonNullable<TextFieldProps['slotProps']>['formHelperText'];
  };
}

/** Keeps the form's hold on the props MUI's `Select` hands its `SelectInput`: those given as its `inputProps`, which
 * replace the `SelectDisplayProps` it builds for the combobox whole, and the select slot itself. `SelectInput` takes
 * their `value` and `disabled` over the form's, the combobox keeps its id and its focus reports, and a locked select
 * can't be held open, as `SelectInput` lets a user pick from an open menu even while disabled. An author's `open`
 * becomes `false` rather than going, since `SelectInput` fixes whether its `open` is controlled on its first render. A
 * locked select also takes no `tabIndex`, which would let a keyboard user focus it and open its menu, as `SelectInput`
 * checks only `readOnly` before a key opens it
 *
 * @param props - The props the form author gives `SelectInput`
 * @param comboboxId - The id `Select` gives the combobox
 * @param locked - Whether the select is disabled or read-only
 * @returns - The props, with those the form owns put back
 */
function omitFormOwnedSelectInputProps<P extends object>(props: P, comboboxId: string, locked: boolean): P {
  // Reads the keys `SelectInput` takes, which the type of the slot that reaches it may not name
  const { open, MenuProps, SelectDisplayProps } = props as {
    open?: unknown;
    MenuProps?: object;
    SelectDisplayProps?: object;
  };
  const lockedKeys = locked ? ['defaultOpen', 'tabIndex'] : [];
  return {
    ...omitKeys(props, ['value', 'disabled', ...lockedKeys]),
    ...(locked && open !== undefined && { open: false }),
    // `SelectInput` spreads these over the `open` it gives its menu
    ...(locked && MenuProps && { MenuProps: { ...MenuProps, open: false } }),
    ...(SelectDisplayProps && {
      SelectDisplayProps: { id: comboboxId, ...omitKeys(omitFormOwnedProps(SelectDisplayProps), lockedKeys) },
    }),
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
>(
  props: WidgetProps<T, S, F> & {
    /** Older MUI `TextField` props, kept off the `TextField` rather than spread on it */
    InputLabelProps?: unknown;
    /** Older MUI `TextField` props, kept off the `TextField` rather than spread on it */
    SelectProps?: unknown;
  },
) {
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
    disabled = false,
    placeholder,
    readonly = false,
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
  const selectedValue = enumOptionSelectedValue(value, enumOptions, isMultiple, optionValueFormat, emptyValue);
  // A multiple select shows a lone value as a one-item selection, so its label shrinks for whatever it shows
  const isEmpty = Array.isArray(selectedValue)
    ? selectedValue.length < 1
    : typeof value === 'undefined' || value === emptyValue;

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<{ value: string }>) =>
    onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyVal));
  // MUI's select focuses a `div` with no value of its own
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(props);
  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, SelectWidgetMuiProps>(options);

  const { InputLabelProps, SelectProps, autocomplete, ...textFieldRemainingProps } = textFieldProps;
  // MUI's select gives its `inputProps` to the element with the `combobox` role, rather than to the field's root. An
  // `htmlInput` given through `rjsfSlotProps` is the form author's own choice for that element, so it is applied last
  const textFieldOverrides = { ...otherMuiProps, ...textFieldRemainingProps } as TextFieldProps;
  const textFieldId = textFieldOverrides.id ?? id;
  const ariaProps = describeByHelperText(widgetAriaProps(props), textFieldId, textFieldOverrides.helperText);
  const ownLabel = labelValue(label || undefined, hideLabel, undefined);
  const textFieldLabel = 'label' in textFieldOverrides ? textFieldOverrides.label : ownLabel;
  const labelId = muiSlotProps?.inputLabel?.id ?? inputLabelId(textFieldId);
  const locked = disabled || readonly;
  // `TextField` gives the `Select` an `input` element of its own, carrying the form's props, which one given here would
  // replace whole
  const { input: _input, ...authorSelect } = muiSlotProps?.select ?? {};
  const comboboxId = authorSelect.id ?? textFieldId;
  /** Drops the form's props from a select's `select` or `input` slot, which MUI spreads over the `TextField`'s own, and
   * applies `omitFormOwnedSelectInputProps()` to the `inputProps` and `slotProps.input` it nests, which reach
   * `SelectInput`, the latter over all the rest */
  const omitFormOwnedSlotProps = <P extends object>(slot: P): P => {
    // Reads the props the slot nests, which its type may not name
    const rest = omitFormOwnedProps(slot) as P & { inputProps?: object; slotProps?: { input?: unknown } };
    const nestedInput = rest.slotProps?.input;
    return {
      ...rest,
      ...(rest.inputProps && { inputProps: omitFormOwnedSelectInputProps(rest.inputProps, comboboxId, locked) }),
      // `InputBase` spreads only an object given here
      ...(typeof nestedInput === 'object' &&
        nestedInput && {
          slotProps: { ...rest.slotProps, input: omitFormOwnedSelectInputProps(nestedInput, comboboxId, locked) },
        }),
    };
  };
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
        label={ownLabel}
        required={templateMarksRequired<T, S, F>(props)}
        autoFocus={autofocus}
        autoComplete={autocomplete}
        placeholder={placeholder}
        error={hasWidgetErrors<T, S, F>(props)}
        {...textFieldOverrides}
        select // Apply this and the following props after the potential overrides defined in textFieldProps
        value={selectedValue}
        disabled={locked}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        slotProps={{
          ...muiSlotProps,
          // MUI puts this slot's `disabled` over the one the `TextField` gives its root, which the select takes
          root: withoutDisabled(muiSlotProps?.root),
          // MUI spreads this slot over the `TextField`'s own handlers and `disabled`
          input: (ownerState: TextFieldOwnerState) =>
            omitFormOwnedSlotProps(resolveSlotProps(muiSlotProps?.input, ownerState) ?? {}),
          inputLabel: {
            ...muiSlotProps?.inputLabel,
            shrink: !isEmpty,
            id: labelId,
          },
          select: {
            // MUI names the combobox by the `labelId` of its select, and gives an `aria-labelledby` among its
            // `inputProps` to the hidden native input instead, so a label the plan names it by goes there
            ...((ariaProps['aria-labelledby'] || textFieldLabel) && {
              labelId: ariaProps['aria-labelledby'] ?? labelId,
            }),
            ...omitFormOwnedSlotProps(omitFormOwnedSelectInputProps(authorSelect, comboboxId, locked)),
            multiple,
          },
          // The `TextField`'s `required` is its marker, which the outline's notch has to fit, so the combobox takes its own
          htmlInput: (ownerState: TextFieldOwnerState) =>
            omitFormOwnedSelectInputProps(
              {
                ...ariaProps,
                required: textFieldOverrides.required ?? required,
                ...resolveSlotProps(muiSlotProps?.htmlInput, ownerState),
              },
              comboboxId,
              locked,
            ),
          formHelperText: helperTextSlot(textFieldId, muiSlotProps?.formHelperText),
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
