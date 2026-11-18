import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, options, value, required, disabled, readonly, autofocus, onChange, onBlur, onFocus } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = ({ target: { value: enumValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  const inline = Boolean(options?.inline);
  const invalid = hasWidgetErrors<T, S, F>(props);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(props, 'radiogroup');

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
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
              autoFocus={index === autofocusIndex}
              isInvalid={invalid}
              value={domValues[index]}
              onChange={handleChange}
              onBlur={blurHandlers[index]}
              onFocus={focusHandlers[index]}
              {...optionAttributes}
            />
          );
          return radio;
        })}
    </Form.Group>
  );
}
