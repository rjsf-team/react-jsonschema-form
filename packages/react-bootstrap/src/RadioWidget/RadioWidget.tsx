import { ChangeEvent, FocusEvent } from 'react';
import Form from 'react-bootstrap/Form';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIsSelected,
  getOptionValueFormat,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

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

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, emptyValue));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));

  const inline = Boolean(options && options.inline);

  return (
    <Form.Group className='mb-0'>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          const checked = enumOptionsIsSelected<S>(option.value, value);

          const radio = (
            <Form.Check
              inline={inline}
              label={option.label}
              id={optionId(id, index)}
              key={index}
              name={htmlName || id}
              type='radio'
              disabled={disabled || itemDisabled || readonly}
              checked={checked}
              required={required}
              value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
              onChange={_onChange}
              onBlur={_onBlur}
              onFocus={_onFocus}
              aria-describedby={ariaDescribedByIds(id)}
            />
          );
          return radio;
        })}
    </Form.Group>
  );
}
