import type { FocusEvent } from 'react';
import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  optionId,
  labelValue,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox';
import { getChakra } from '../utils';

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    disabled,
    options,
    value,
    readonly,
    onChange,
    onBlur,
    onFocus,
    required,
    label,
    rawErrors = [],
    hideLabel,
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, emptyValue));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, true, optionValueFormat, []) as string[];

  const chakraProps = getChakra({ uiSchema });

  return (
    <FieldsetRoot
      mb={1}
      disabled={disabled || readonly}
      invalid={rawErrors && rawErrors.length > 0}
      {...(chakraProps as any)}
    >
      {!hideLabel && label && <FieldsetLegend>{labelValue(label)}</FieldsetLegend>}
      <CheckboxGroup
        onValueChange={(option) =>
          onChange(enumOptionValueDecoder<S>(option, enumOptions, optionValueFormat, emptyValue))
        }
        value={selectValue}
        aria-describedby={ariaDescribedByIds(id)}
        readOnly={readonly}
        invalid={required && value.length === 0}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
              return (
                <Checkbox
                  key={index}
                  id={optionId(id, index)}
                  name={htmlName || id}
                  value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                  disabled={disabled || itemDisabled || readonly}
                  onBlur={_onBlur}
                  onFocus={_onFocus}
                >
                  {option.label && <Text>{option.label}</Text>}
                </Checkbox>
              );
            })}
        </Stack>
      </CheckboxGroup>
    </FieldsetRoot>
  );
}
