import { FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  WidgetProps,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';
import Form from 'react-bootstrap/Form';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, disabled, readonly, label, schema, autofocus, onChange, onBlur, onFocus } = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);

  const _onChange = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onChange(checked);
  const _onBlur = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onBlur(id, checked);
  const _onFocus = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onFocus(id, checked);

  const desc = label || schema.description;
  return (
    <Form.Group
      className={`checkbox ${disabled || readonly ? 'disabled' : ''}`}
      aria-describedby={ariaDescribedByIds<T>(id)}
    >
      <Form.Check
        id={id}
        name={id}
        label={desc}
        checked={typeof value === 'undefined' ? false : value}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={_onChange}
        type='checkbox'
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </Form.Group>
  );
}
