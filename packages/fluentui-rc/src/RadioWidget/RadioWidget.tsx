import type { FocusEvent } from 'react';
import type { RadioGroupProps } from '@fluentui/react-components';
import { Label, Radio, RadioGroup } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionSelectedValue,
  enumOptionsDomValues,
  getGroupLabelling,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, options, value, required, disabled, readonly, autofocus, label, onChange, onBlur, onFocus } =
    props;
  const { enumOptions, enumDisabled, emptyValue, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange: NonNullable<RadioGroupProps['onChange']> = (_, data) =>
    onChange(enumOptionValueDecoder<S>(data.value, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));

  // Compared against the options' own values, which are encoded in the `optionValueFormat` rather than always indexes
  const selectedValue: string | undefined = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat);

  const {
    drawsLabel,
    labelId,
    group: groupAttributes,
    option: optionAttributes,
  } = getGroupLabelling<T, S, F>(props, 'radiogroup');

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return (
    <>
      {drawsLabel && (
        <Label id={labelId} required={required}>
          {label}
        </Label>
      )}
      <RadioGroup
        id={id}
        name={htmlName || id}
        required={required}
        layout={inline ? 'horizontal' : 'vertical'}
        value={selectedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...groupAttributes}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
            return (
              <Radio
                id={optionId(id, index)}
                autoFocus={index === autofocusIndex}
                label={option.label}
                value={domValues[index]}
                // oxlint-disable-next-line react/no-array-index-key
                key={index}
                disabled={disabled || itemDisabled || readonly}
                {...optionAttributes}
              />
            );
          })}
      </RadioGroup>
    </>
  );
}
