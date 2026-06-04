import type { ChangeEvent, FocusEvent } from 'react';
import { Stack } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
  optionId,
} from '@rjsf/utils';

import { Field } from '../components/ui/field';
import { Radio, RadioGroup } from '../components/ui/radio';
import { getChakra } from '../utils';

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
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
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const _onChange = ({ target: { value: enumValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const _onBlur = ({ target: { value: enumValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const _onFocus = ({ target: { value: enumValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, false, optionValueFormat, null);

  const chakraProps = getChakra({ uiSchema });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <RadioGroup
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        value={selectValue}
        name={htmlName || id}
        aria-describedby={ariaDescribedByIds(id)}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);

              return (
                <Radio
                  value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                  key={index}
                  id={optionId(id, index)}
                  disabled={disabled || itemDisabled || readonly}
                >
                  {option.label}
                </Radio>
              );
            })}
        </Stack>
      </RadioGroup>
    </Field>
  );
}
