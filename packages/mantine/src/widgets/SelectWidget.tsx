import type { FocusEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { ComboboxParsedItem, OptionsFilter } from '@mantine/core';
import { defaultOptionsFilter, MultiSelect, Select } from '@mantine/core';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { cleanupOptions, visibleErrorText } from '../utils.ts';

/** Mantine's default filter keeps a group in the dropdown even when the search matched none of its options, which
 * leaves a bare heading behind, so the groups it emptied are dropped here.
 */
const optionsFilter: OptionsFilter = (input) =>
  (defaultOptionsFilter(input) as ComboboxParsedItem[]).filter((item) => !('group' in item) || item.items.length > 0);

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    multiple,
    schema,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const themeProps = cleanupOptions(options);
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, optionValueFormat],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, optionValueFormat],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, optionValueFormat],
  );

  const selectOptions = useMemo(() => {
    const toComboboxItem = (option: IndexedEnumOptionType<S>) => ({
      key: String(option.index),
      value: enumOptionValueEncoder(option.value, option.index, optionValueFormat),
      label: option.label,
      disabled: option.disabled,
    });
    return groupEnumOptions<S>(enumOptions, optgroups, enumDisabled).map((item) =>
      isEnumOptionsGroup<S>(item)
        ? { group: item.label, items: item.options.map(toComboboxItem) }
        : toComboboxItem(item),
    );
  }, [enumDisabled, enumOptions, optgroups, optionValueFormat]);

  const sharedProps = {
    id,
    name: htmlName || id,
    label: labelValue(label || undefined, hideLabel, false),
    data: selectOptions,
    onChange: !readonly ? handleChange : undefined,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
    autoFocus: autofocus,
    placeholder,
    disabled: disabled || readonly,
    required,
    error: visibleErrorText(props),
    searchable: true,
    filter: optionsFilter,
    'aria-describedby': ariaDescribedByIds(id),
    comboboxProps: { withinPortal: false },
    ...themeProps,
  };

  return (
    <>
      <SelectedOptionDescription {...props} />
      {multiple ? (
        <MultiSelect
          {...sharedProps}
          value={enumOptionSelectedValue<S>(value, enumOptions, true, optionValueFormat, []) as string[]}
        />
      ) : (
        <Select
          {...sharedProps}
          value={enumOptionSelectedValue<S>(value, enumOptions, false, optionValueFormat, null) as string | null}
        />
      )}
    </>
  );
}
