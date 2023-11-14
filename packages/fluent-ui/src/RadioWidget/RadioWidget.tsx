import { FormEvent, FocusEvent } from 'react';
import { ChoiceGroup, IChoiceGroupOption, IChoiceGroupProps } from '@fluentui/react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

const allowedProps: (keyof IChoiceGroupProps)[] = [
  'componentRef',
  'options',
  'defaultSelectedKey',
  'selectedKey',
  'onChange',
  'label',
  /* Backward compatibility with fluentui v7 */
  'onChanged' as any,
  'theme',
  'styles',
  'ariaLabelledBy',
];

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  label,
  hideLabel,
  onChange,
  onBlur,
  onFocus,
  disabled,
  readonly,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;

  function _onChange(_ev?: FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    if (option) {
      onChange(enumOptionsValueForIndex<S>(option.key, enumOptions, emptyValue));
    }
  }

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const newOptions = Array.isArray(enumOptions)
    ? enumOptions.map((option, index) => ({
        key: String(index),
        name: id,
        id: optionId(id, index),
        text: option.label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1,
        'aria-describedby': ariaDescribedByIds<T>(id),
      }))
    : [];

  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) as string;

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  return (
    <ChoiceGroup
      id={id}
      name={id}
      options={newOptions}
      disabled={disabled || readonly}
      onChange={_onChange}
      onFocus={_onFocus}
      onBlur={_onBlur}
      label={labelValue(label, hideLabel || !label)}
      required={required}
      selectedKey={selectedIndex}
      {...uiProps}
    />
  );
}
