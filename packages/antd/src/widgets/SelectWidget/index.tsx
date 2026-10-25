import { useMemo, useState } from 'react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  flattenGroupedOptions,
  getOptionValueFormat,
  groupEnumOptions,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  useSelectFocusHandlers,
  widgetAriaProps,
  widgetDrawsLabel,
} from '@rjsf/utils';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select/index.js';

import useControlState from '../../controlState.ts';

const SELECT_STYLE = {
  width: '100%',
};

/** The entries a native `<select>` posts: one per selected option, but none for a selected option that is disabled */
function postedDomValues(
  selected: string | string[],
  showPlaceholderOption: boolean,
  fallbackDomValue: string | undefined,
  disabledDomValues: ReadonlySet<string>,
): string[] {
  if (Array.isArray(selected)) {
    return [...new Set(selected)].filter((domValue) => !disabledDomValues.has(domValue));
  }
  if (selected === '' && !showPlaceholderOption) {
    return fallbackDomValue === undefined ? [] : [fallbackDomValue];
  }
  return disabledDomValues.has(selected) ? [] : [selected];
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
    autofocus,
    disabled,
    registry,
    id,
    htmlName,
    multiple,
    onBlur,
    onChange,
    onFocus,
    options,
    placeholder,
    readonly,
    required,
    value,
    schema,
    uiSchema,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const [open, setOpen] = useState(false);
  const control = useControlState<T, S, F>({ disabled, readonly, registry });

  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = useMemo(
    () => enumOptionsDomValues<S>(enumOptions, optionValueFormat),
    [enumOptions, optionValueFormat],
  );

  const handleChange: SelectProps['onChange'] = (nextValue) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>({ id, value, options, onFocus, onBlur });

  const filterOption: SelectProps['filterOption'] = (input, option) => {
    // A group is offered here before its own options are, and matching one keeps every option it holds, including the
    // ones the search rules out, so groups are rejected and left to be kept by whichever of their options match
    if (option?.options) {
      return false;
    }
    if (option && typeof option.label === 'string') {
      // labels are strings in this context
      return option.label.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  const getPopupContainer = SelectWidget.getPopupContainerCallback();

  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const groupedOptions = useMemo(
    () => groupEnumOptions<S>(enumOptions, optgroups, enumDisabled),
    [enumOptions, optgroups, enumDisabled],
  );

  const { disabledDomValues, firstEnabledDomValue } = useMemo(() => {
    const drawnOptions = flattenGroupedOptions<S>(groupedOptions);
    const firstEnabled = drawnOptions.find((option) => !option.disabled);
    return {
      disabledDomValues: new Set(drawnOptions.filter((option) => option.disabled).map(({ index }) => domValues[index])),
      firstEnabledDomValue: firstEnabled && domValues[firstEnabled.index],
    };
  }, [groupedOptions, domValues]);

  const selected = enumOptionSelectedValue(value, enumOptions, !!multiple, optionValueFormat, multiple ? [] : '');
  // With no empty placeholder to fall back on, a native `<select>` that holds no option selects its first enabled one in
  // the order they are drawn, or none at all, so the `Select` draws that one too
  const fallbackDomValue = selected === '' && !showPlaceholderOption ? firstEnabledDomValue : undefined;
  const selectValue =
    fallbackDomValue ?? enumOptionSelectedValue(value, enumOptions, !!multiple, optionValueFormat, emptyValue);

  const postedValues = postedDomValues(selected, showPlaceholderOption, fallbackDomValue, disabledDomValues);

  const selectOptions: DefaultOptionType[] | undefined = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      const toOptionType = (option: IndexedEnumOptionType<S>): DefaultOptionType => ({
        disabled: option.disabled,
        key: String(option.index),
        value: domValues[option.index],
        label: option.label,
      });
      const enumOptionsList: DefaultOptionType[] = groupedOptions.map((item) =>
        isEnumOptionsGroup<S>(item)
          ? { label: item.label, options: item.options.map(toOptionType) }
          : toOptionType(item),
      );

      if (showPlaceholderOption) {
        enumOptionsList.unshift({ value: '', label: placeholder || '' });
      }
      return enumOptionsList;
    }
    return undefined;
  }, [enumOptions, groupedOptions, placeholder, showPlaceholderOption, domValues]);

  return (
    <>
      <Select
        open={open}
        autoFocus={autofocus}
        disabled={control.disabled}
        getPopupContainer={getPopupContainer}
        id={id}
        mode={multiple ? 'multiple' : undefined}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        style={SELECT_STYLE}
        value={selectValue}
        // When the open change is called, set the open state, needed so that the select opens properly in the playground
        onOpenChange={setOpen}
        showSearch={{ filterOption }}
        {...widgetAriaProps(props)}
        aria-required={required || undefined}
        options={selectOptions}
      />
      {/* antd's `Select` renders no native control, so the value a native submit or `FormData` reads is carried by
      hidden inputs, as a native `<select>` posts one entry per selected option, or its empty placeholder */}
      {postedValues.map((domValue) => (
        <input key={domValue} type='hidden' name={htmlName || id} value={domValue} disabled={control.disabled} />
      ))}
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
        hideLabel={hideLabel}
        presentation={presentation}
      />
    </>
  );
}

/** Give the playground a place to hook into the `getPopupContainer` callback generation function so that it can be
 * disabled while in the playground. Since the callback is a simple function, it can be returned by this static
 * "generator" function. The default never returns `undefined`; the return type allows it because that is how the
 * playground's replacement turns the callback off. A trigger without a parent element gets `document.body`, antd's own
 * default container.
 */
SelectWidget.getPopupContainerCallback = (): ((node: HTMLElement) => HTMLElement) | undefined => (node) =>
  node.parentElement ?? document.body;
