import { FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  EnumOptionsType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  UIOptionsType,
} from '@rjsf/utils';

import { MultiSelect, Select } from '@mantine/core';

/**
 * Returns and creates an array format required for mantine drop down
 * @param {array} enumOptions- array of items for the dropdown
 * @param {array} enumDisabled - array of enum option values to disable
 * @returns {*}
 */
function createDefaultValueOptionsForDropDown<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions?: EnumOptionsType<S>[],
  enumDisabled?: UIOptionsType['enumDisabled']
) {
  const disabledOptions = enumDisabled || [];
  if (!enumOptions) {
    return [];
  }
  const options = enumOptions.map(({ label, value }, index) => ({
    disabled: disabledOptions.indexOf(value) !== -1,
    key: label,
    label,
    value: String(index),
  }));
  return options;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    options,
    label,
    hideLabel,
    required,
    disabled,
    readonly,
    value,
    multiple,
    placeholder,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
  } = props;
  const { enumDisabled, enumOptions } = options;

  const emptyValue: string[] | string = multiple ? [] : '';
  const dropdownOptions = createDefaultValueOptionsForDropDown<S>(enumOptions, enumDisabled);
  const _onChange = (e: any) => onChange(enumOptionsValueForIndex<S>(e.value, enumOptions, emptyValue));
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  if (multiple) {
    return (
      <MultiSelect
        key={id}
        id={id}
        name={id}
        label={labelValue(label || undefined, hideLabel, false)}
        value={typeof value === 'undefined' ? (emptyValue as string[]) : (selectedIndexes as string[])}
        error={rawErrors.length > 0}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        autoFocus={autofocus}
        readOnly={readonly}
        data={dropdownOptions}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    );
  }

  return (
    <Select
      key={id}
      id={id}
      name={id}
      label={labelValue(label || undefined, hideLabel, false)}
      multiple={typeof multiple === 'undefined' ? false : multiple}
      value={typeof value === 'undefined' ? (emptyValue as string) : (selectedIndexes as string)}
      error={rawErrors.length > 0}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      autoFocus={autofocus}
      readOnly={readonly}
      data={dropdownOptions}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
