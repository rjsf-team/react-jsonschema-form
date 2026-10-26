import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getGroupAttributes,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';

import useControlState from '../../controlState.ts';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  autofocus,
  disabled,
  registry,
  id,
  htmlName,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  required,
  value,
  presentation,
}: WidgetProps<T, S, F>) {
  const control = useControlState<T, S, F>({ disabled, readonly, required, registry });

  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = ({ target: { value: nextValue } }: RadioChangeEvent) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  const selectValue = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat, emptyValue);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
  return (
    <Radio.Group
      id={id}
      name={htmlName || id}
      onChange={!readonly ? handleChange : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      // Controlled even with no value, so a click on a read-only group, which `readonlyAsDisabled: false` leaves
      // enabled, checks nothing the form doesn't hold
      value={selectValue ?? null}
      {...groupAttributes}
      aria-readonly={control.ariaReadonly}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => (
          <Radio
            id={optionId(id, i)}
            name={htmlName || id}
            autoFocus={i === autofocusIndex}
            // `undefined` rather than `false` for an enabled option, since antd reads its `DisabledContext` only when
            // the radio leaves `disabled` unset
            disabled={control.disabled || enumOptionsIsDisabled(option.value, enumDisabled) || undefined}
            // oxlint-disable-next-line react/no-array-index-key
            key={i}
            required={control.toggleRequired}
            value={domValues[i]}
            {...optionAttributes}
          >
            {option.label}
          </Radio>
        ))}
    </Radio.Group>
  );
}
