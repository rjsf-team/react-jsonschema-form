import type {
  FormContextType,
  GroupedEnumOptionsType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  flattenGroupedOptions,
  getOptionValueFormat,
  hasVisibleErrors,
  groupEnumOptions,
  isEnumOptionsGroup,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { FancyMultiSelect } from '../components/ui/fancy-multi-select.tsx';
import type { FancySelectItem, FancySelectSection } from '../components/ui/fancy-select.tsx';
import { FancySelect } from '../components/ui/fancy-select.tsx';
import { cn } from '../lib/utils.ts';

/** Splits `groupedOptions` into the `FancySelectSection` list consumed by `FancySelect`/`FancyMultiSelect`: one
 * section per `ui:options.optgroups` group, plus a trailing unheaded section for any ungrouped options.
 */
function toSections<S extends StrictRJSFSchema = RJSFSchema>(
  groupedOptions: GroupedEnumOptionsType<S>[],
  toItem: (option: IndexedEnumOptionType<S>) => FancySelectItem,
): FancySelectSection[] {
  const sections: FancySelectSection[] = [];
  const ungrouped: FancySelectItem[] = [];
  groupedOptions.forEach((item) => {
    if (isEnumOptionsGroup<S>(item)) {
      sections.push({ label: item.label, items: item.options.map(toItem) });
    } else {
      ungrouped.push(toItem(item));
    }
  });
  if (ungrouped.length > 0) {
    sections.push({ items: ungrouped });
  }
  return sections;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  required,
  disabled,
  readonly,
  value,
  schema,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors,
  hideError,
  className,
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const handleFancyFocus = () => {
    onFocus(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, optEmptyValue));
  };

  const handleFancyBlur = () => {
    onBlur(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, optEmptyValue));
  };

  const toFancyItem = (option: IndexedEnumOptionType<S>): FancySelectItem => ({
    value: multiple ? option.value : enumOptionValueEncoder(option.value, option.index, optionValueFormat),
    label: option.label,
    index: option.index,
    disabled: option.disabled,
  });

  // `optgroups` is presentational, so `items` stays in enum order: the fancy selects derive their current selection by
  // filtering `items`, so that order reaches the array written to formData. Grouping is applied to `sections`, which
  // is what the popup actually renders.
  const items = flattenGroupedOptions<S>(groupEnumOptions<S>(enumOptions, undefined, enumDisabled)).map(toFancyItem);
  const sections = optgroups
    ? toSections<S>(groupEnumOptions<S>(enumOptions, optgroups, enumDisabled), toFancyItem)
    : undefined;

  const cnClassName = cn({ 'border-destructive': hasVisibleErrors({ rawErrors, hideError }) }, className);

  return (
    <div className='p-0.5'>
      {!multiple ? (
        <FancySelect
          id={id}
          items={items}
          sections={sections}
          selected={enumOptionSelectedValue<S>(value, enumOptions, false, optionValueFormat, '') as string}
          onValueChange={(selectedValue) => {
            onChange(enumOptionValueDecoder<S>(selectedValue, enumOptions, optionValueFormat, optEmptyValue));
          }}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          required={required}
          placeholder={placeholder}
          className={cnClassName}
          onFocus={handleFancyFocus}
          onBlur={handleFancyBlur}
          ariaDescribedby={ariaDescribedByIds(id)}
        />
      ) : (
        <FancyMultiSelect
          id={id}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          multiple
          className={cnClassName}
          items={items}
          sections={sections}
          selected={value}
          onValueChange={(values) => {
            onChange(enumOptionValueDecoder<S>(values.map(String), enumOptions, optionValueFormat, optEmptyValue));
          }}
          onFocus={handleFancyFocus}
          onBlur={handleFancyBlur}
        />
      )}
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
    </div>
  );
}
