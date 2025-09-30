import { FocusEvent } from 'react';
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
import { Label, Radio, RadioGroup, RadioGroupOnChangeData } from '@fluentui/react-components';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  hideLabel,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue, inline } = options;

  const _onChange = (_: any, data: RadioGroupOnChangeData) =>
    onChange(enumOptionsValueForIndex<S>(data.value, enumOptions, emptyValue));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) ?? undefined;

  return (
    <>
      {labelValue(
        <Label required={required} htmlFor={id}>
          {label || undefined}
        </Label>,
        hideLabel,
      )}
      <RadioGroup
        id={id}
        name={id}
        layout={inline ? 'horizontal' : 'vertical'}
        value={selectedIndex as string | undefined}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            return (
              <Radio
                id={optionId(id, index)}
                label={option.label}
                value={String(index)}
                key={index}
                disabled={disabled || itemDisabled || readonly}
              />
            );
          })}
      </RadioGroup>
    </>
  );
}
