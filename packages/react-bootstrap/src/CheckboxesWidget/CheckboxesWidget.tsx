import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, autofocus, readonly, onChange, onBlur, onFocus, presentation } =
    props;
  const { enumOptions, enumDisabled, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
      }
    };

  const invalid = hasWidgetErrors<T, S, F>(props);
  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'group',
  );

  return (
    <Form.Group id={id} {...groupAttributes}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);

          return (
            <Form.Check
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              inline={inline}
              checked={checked}
              isInvalid={invalid}
              value={domValues[index]}
              className='bg-transparent border-0'
              type='checkbox'
              id={optionId(id, index)}
              name={htmlName || id}
              label={option.label}
              autoFocus={autofocus && index === 0}
              onChange={handleChange(index)}
              onBlur={blurHandlers[index]}
              onFocus={focusHandlers[index]}
              disabled={disabled || itemDisabled || readonly}
              {...optionAttributes}
            />
          );
        })}
    </Form.Group>
  );
}
