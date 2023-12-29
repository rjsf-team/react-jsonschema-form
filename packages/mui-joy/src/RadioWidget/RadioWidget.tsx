import { ChangeEvent, FocusEvent } from 'react';
import FormLabel from '@mui/joy/FormLabel';
import Radio from '@mui/joy/Radio';
import RadioGroup from '@mui/joy/RadioGroup';
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
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionsValueForIndex<S>(event.target.value, enumOptions, emptyValue));
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  // const row = options ? options.inline : false;
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) ?? null;

  return (
    <>
      {labelValue(
        <FormLabel required={required} htmlFor={id}>
          {label || undefined}
        </FormLabel>,
        hideLabel
      )}
      <RadioGroup
        id={id}
        name={id}
        value={selectedIndex}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const radio = (
              <Radio
                name={id}
                label={option.label}
                id={optionId(id, index)}
                color='primary'
                value={String(index)}
                key={index}
                disabled={disabled || itemDisabled || readonly}
              />
            );

            return radio;
          })}
      </RadioGroup>
    </>
  );
}
