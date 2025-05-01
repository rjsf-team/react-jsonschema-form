import { FormContextType, rangeSpec, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ChangeEvent, FocusEvent } from 'react';
import FormRange from 'react-bootstrap/FormRange';

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, value, disabled, onChange, onBlur, onFocus, schema } = props;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => onChange(value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

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
