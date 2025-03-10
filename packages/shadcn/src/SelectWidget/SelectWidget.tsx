import {
  ariaDescribedByIds,
  FormContextType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { FancyMultiSelect } from '../components/ui/fancy-multi-select';
import { FancySelect } from '../components/ui/fancy-select';
import { cn } from '../lib/utils';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;

  const _onFancyFocus = () => {
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyValue));
  };

  const _onFancyBlur = () => {
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyValue));
  };

  const items = (enumOptions as any)?.map(({ value, label }: any, index: number) => ({
    value: multiple ? value : index.toString(),
    label: label,
    index,
    disabled: Array.isArray(enumDisabled) && enumDisabled.includes(value),
  }));

  return !multiple ? (
    <div className='p-0.5'>
      <FancySelect
        items={items}
        selected={enumOptionsIndexForValue<S>(value ?? defaultValue, enumOptions, false) as unknown as string}
        onValueChange={(selectedValue) => {
          onChange(enumOptionsValueForIndex<S>(selectedValue, enumOptions, optEmptyValue));
        }}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        required={required}
        placeholder={placeholder}
        className={cn({ 'border-destructive': rawErrors.length > 0 })}
        onFocus={_onFancyFocus}
        onBlur={_onFancyBlur}
        ariaDescribedby={ariaDescribedByIds<T>(id)}
      />
    </div>
  ) : (
    <div className='p-0.5'>
      <FancyMultiSelect
        ariaDescribedby={ariaDescribedByIds<T>(id)}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        multiple
        className={rawErrors.length > 0 ? 'border-destructive' : ''}
        items={items}
        selected={value}
        onValueChange={(values) => {
          onChange(enumOptionsValueForIndex<S>(values, enumOptions, optEmptyValue));
        }}
        onFocus={_onFancyFocus}
        onBlur={_onFancyBlur}
        id={id}
      />
    </div>
  );
}
