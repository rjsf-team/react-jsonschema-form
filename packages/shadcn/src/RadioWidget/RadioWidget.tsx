import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIsSelected,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { FocusEvent } from 'react';

import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { cn } from '../lib/utils';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  className,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const useRealValues = !!options.useRealOptionValues;

  const _onChange = (value: string) =>
    onChange(enumOptionValueDecoder<S>(value, enumOptions, useRealValues, emptyValue));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));

  const inline = Boolean(options && options.inline);

  return (
    <div className='mb-0'>
      <RadioGroup
        defaultValue={value?.toString()}
        required={required}
        disabled={disabled || readonly}
        onValueChange={(e: string) => {
          _onChange(e);
        }}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id)}
        orientation={inline ? 'horizontal' : 'vertical'}
        className={cn('flex flex-wrap', { 'flex-col': !inline }, className)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const checked = enumOptionsIsSelected<S>(option.value, value);
            return (
              <div className='flex items-center gap-2' key={optionId(id, index)}>
                <RadioGroupItem
                  checked={checked}
                  value={enumOptionValueEncoder(option.value, index, useRealValues)}
                  id={optionId(id, index)}
                  disabled={itemDisabled}
                />
                <Label className='leading-tight' htmlFor={optionId(id, index)}>
                  {option.label}
                </Label>
              </div>
            );
          })}
      </RadioGroup>
    </div>
  );
}
