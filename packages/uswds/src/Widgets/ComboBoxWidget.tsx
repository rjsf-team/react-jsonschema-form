import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  enumOptionsValueForIndex,
} from '@rjsf/utils';
import { ComboBox as UswdsComboBox } from '@trussworks/react-uswds';

export default function ComboBoxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, options, value, disabled, readonly, onChange }: WidgetProps<T, S, F>) {
  const { enumOptions = [], enumDisabled } = options;

  function _onChange(inputValue?: string) {
    onChange(enumOptionsValueForIndex(inputValue || '', enumOptions));
  }

  const comboBoxOptions = (enumOptions || []).map((option) => ({
    value: String(option.value),
    label: option.label,
    disabled: Array.isArray(enumDisabled) && enumDisabled.includes(option.value),
  }));

  return (
    <UswdsComboBox
      id={id}
      name={id}
      disabled={disabled || readonly}
      onChange={!readonly ? _onChange : () => {}}
      options={comboBoxOptions}
      defaultValue={String(value ?? '')}
    />
  );
}
