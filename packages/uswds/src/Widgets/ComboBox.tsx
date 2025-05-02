import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, enumOptionsValueForIndex } from '@rjsf/utils';
import { ComboBox as UswdsComboBox } from '@trussworks/react-uswds';

export default function ComboBox<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  placeholder,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled } = options;

  const _onChange = (value?: string) => onChange(enumOptionsValueForIndex(value || '', enumOptions));
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onBlur(id, enumOptionsValueForIndex(v, enumOptions));
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onFocus(id, enumOptionsValueForIndex(v, enumOptions));

  return (
    <UswdsComboBox
      id={id}
      name={id}
      disabled={disabled || readonly}
      onChange={_onChange}
      options={enumOptions || []}
      defaultValue={value}
    />
  );
}
