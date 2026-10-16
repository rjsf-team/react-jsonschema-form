import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
  optionId,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

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
    presentation,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = ({ target: { value: enumValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const inline = Boolean(options?.inline);
  const invalid = hasWidgetErrors<T, S, F>(props);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );

  return (
    <Form.Group className='mb-0' id={id} {...groupAttributes}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
          const checked = enumOptionsIsSelected<S>(option.value, value, false);

          const radio = (
            <Form.Check
              inline={inline}
              label={option.label}
              id={optionId(id, index)}
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              name={htmlName || id}
              type='radio'
              disabled={disabled || itemDisabled || readonly}
              checked={checked}
              required={required}
              autoFocus={autofocus && index === 0}
              isInvalid={invalid}
              value={domValues[index]}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              {...optionAttributes}
            />
          );
          return radio;
        })}
    </Form.Group>
  );
}
