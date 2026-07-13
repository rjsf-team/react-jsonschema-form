import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { FancyMultiSelect } from '../components/ui/fancy-multi-select';
import { FancySelect } from '../components/ui/fancy-select';
import { cn } from '../lib/utils';

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
  rawErrors = [],
  className,
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const handleFancyFocus = () => {
    onFocus(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, optEmptyValue));
  };

  const handleFancyBlur = () => {
    onBlur(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, optEmptyValue));
  };

  const items = (enumOptions as any)?.map(({ value: enumValue, label: enumLabel }: any, index: number) => ({
    value: multiple ? enumValue : enumOptionValueEncoder(enumValue, index, optionValueFormat),
    label: enumLabel,
    index,
    disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
  }));

  const cnClassName = cn({ 'border-destructive': rawErrors.length > 0 }, className);

  return (
    <div className='p-0.5'>
      {!multiple ? (
        <FancySelect
          items={items}
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
