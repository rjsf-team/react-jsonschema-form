import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
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
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    className,
    presentation,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = (enumValue: string) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  // On each radio rather than the group: Radix's group takes focus itself to pass it on to a radio, as when it is
  // tabbed into or focusOnFirstError focuses the field's id, which it carries, so it would report a focus and blur
  // of no value first
  const handleBlur = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const inline = Boolean(options?.inline);
  const selectValue = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat, '');
  const radioClassName = cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) });
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );

  return (
    <div className='mb-0'>
      <RadioGroup
        id={id}
        name={htmlName || id}
        {...groupAttributes}
        value={selectValue}
        required={required}
        disabled={disabled || readonly}
        onValueChange={(e: string) => {
          handleChange(e);
        }}
        orientation={inline ? 'horizontal' : 'vertical'}
        className={cn('flex flex-wrap', { 'flex-col': !inline }, className)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const optionDisabled = disabled || readonly || enumOptionsIsDisabled(option.value, enumDisabled);
            return (
              <div className='flex items-center gap-2' key={optionId(id, index)}>
                <RadioGroupItem
                  value={domValues[index]}
                  id={optionId(id, index)}
                  disabled={optionDisabled}
                  autoFocus={autofocus && index === 0}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  className={radioClassName}
                  {...optionAttributes}
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
