import { ChangeEvent, FocusEvent } from 'react';
import Form from 'react-bootstrap/Form';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, disabled, options, value, autofocus, readonly, required, onChange, onBlur, onFocus }: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
      }
    };

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  return (
    <Form.Group>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;

          return (
            <Form.Check
              key={option.value}
              inline={inline}
              custom
              required={required}
              checked={checked}
              className='bg-transparent border-0'
              type={'checkbox'}
              id={optionId(id, index)}
              name={id}
              label={option.label}
              autoFocus={autofocus && index === 0}
              onChange={_onChange(index)}
              onBlur={_onBlur}
              onFocus={_onFocus}
              disabled={disabled || itemDisabled || readonly}
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
        })}
    </Form.Group>
  );
}
