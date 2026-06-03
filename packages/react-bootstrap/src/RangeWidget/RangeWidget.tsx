import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { rangeSpec } from '@rjsf/utils';
import FormRange from 'react-bootstrap/FormRange';

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, value, disabled, onChange, onBlur, onFocus, schema } = props;

  const _onChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) => onChange(newValue);
  const _onBlur = ({ target: { value: newValue } }: FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
  const _onFocus = ({ target: { value: newValue } }: FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

  const rangeProps = {
    value,
    id,
    name: id,
    disabled,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus,
    ...rangeSpec<S>(schema),
  };

  return (
    <>
      <FormRange {...rangeProps} />
      <span className='range-view'>{value}</span>
    </>
  );
}
