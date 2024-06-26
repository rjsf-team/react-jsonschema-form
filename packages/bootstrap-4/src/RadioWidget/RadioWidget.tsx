import { ChangeEvent, FocusEvent } from 'react';
import Form from 'react-bootstrap/Form';
import {
  ariaDescribedByIds,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

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
              name={id}
              type='radio'
              disabled={disabled || itemDisabled || readonly}
              checked={checked}
              required={required}
              value={String(index)}
              onChange={_onChange}
              onBlur={_onBlur}
              onFocus={_onFocus}
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
          return radio;
        })}
    </Form.Group>
  );
}
