import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';

import { Label } from '../components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { cn } from '../lib/utils.ts';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, options, value, required, disabled, readonly, onChange, onBlur, onFocus, className }: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = (enumValue: string) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const inline = Boolean(options?.inline);
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, false, optionValueFormat, '');

  return (
    <div className='mb-0'>
      <RadioGroup
        value={selectValue}
        required={required}
        disabled={disabled || readonly}
        onValueChange={(e: string) => {
          handleChange(e);
        }}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
        orientation={inline ? 'horizontal' : 'vertical'}
        className={cn('flex flex-wrap', { 'flex-col': !inline }, className)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
            return (
              <div className='flex items-center gap-2' key={optionId(id, index)}>
                <RadioGroupItem value={domValues[index]} id={optionId(id, index)} disabled={itemDisabled} />
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
