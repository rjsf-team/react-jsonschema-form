import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  disabled,
  options,
  value,
  autofocus,
  readonly,
  required,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
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

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  return (
    <Form.Group>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled =
            Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value);

          return (
            <Form.Check
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              inline={inline}
              required={required}
              checked={checked}
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
              aria-describedby={ariaDescribedByIds(id)}
            />
          );
        })}
    </Form.Group>
  );
}
