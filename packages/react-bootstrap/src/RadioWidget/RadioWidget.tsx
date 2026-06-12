import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIsSelected,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';
import Form from 'react-bootstrap/Form';

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
  options,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleChange = ({ target: { value: enumValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const inline = Boolean(options?.inline);

  return (
    <Form.Group className='mb-0'>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          const checked = enumOptionsIsSelected<S>(option.value, value);

          const radio = (
            <Form.Check
              inline={inline}
              label={option.label}
              id={optionId(id, index)}
              key={String(option.value)}
              name={htmlName || id}
              type='radio'
              disabled={disabled || itemDisabled || readonly}
              checked={checked}
              required={required}
              value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              aria-describedby={ariaDescribedByIds(id)}
            />
          );
          return radio;
        })}
    </Form.Group>
  );
}
