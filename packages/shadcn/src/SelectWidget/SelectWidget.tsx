import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
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
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  defaultValue,
  placeholder,
  rawErrors = [],
  className,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;
  const useRealValues = !!options.useRealOptionValues;

  const _onFancyFocus = () => {
    onFocus(id, enumOptionValueDecoder<S>(value, enumOptions, useRealValues, optEmptyValue));
  };

  const _onFancyBlur = () => {
    onBlur(id, enumOptionValueDecoder<S>(value, enumOptions, useRealValues, optEmptyValue));
  };

  const items = (enumOptions as any)?.map(({ value, label }: any, index: number) => ({
    value: multiple ? value : enumOptionValueEncoder(value, index, useRealValues),
    label: label,
    index,
    disabled: Array.isArray(enumDisabled) && enumDisabled.includes(value),
  }));

  const cnClassName = cn({ 'border-destructive': rawErrors.length > 0 }, className);

  return (
    <div className='p-0.5'>
      {!multiple ? (
        <FancySelect
          items={items}
          selected={
            useRealValues
              ? typeof value === 'undefined'
                ? ''
                : String(value)
              : (enumOptionsIndexForValue<S>(value ?? defaultValue, enumOptions, false) as unknown as string)
          }
          onValueChange={(selectedValue) => {
            onChange(enumOptionValueDecoder<S>(selectedValue, enumOptions, useRealValues, optEmptyValue));
          }}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          required={required}
          placeholder={placeholder}
          className={cnClassName}
          onFocus={_onFancyFocus}
          onBlur={_onFancyBlur}
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
            onChange(enumOptionValueDecoder<S>(values, enumOptions, useRealValues, optEmptyValue));
          }}
          onFocus={_onFancyFocus}
          onBlur={_onFancyBlur}
        />
      )}
    </div>
  );
}
