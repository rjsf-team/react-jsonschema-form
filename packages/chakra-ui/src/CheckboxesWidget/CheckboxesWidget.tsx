import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  labelValue,
} from '@rjsf/utils';
import { FocusEvent } from 'react';

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
  const useRealValues = !!options.useRealOptionValues;

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue));

  const row = options ? options.inline : false;
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, true) as string[];

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
        onValueChange={(option) => onChange(enumOptionValueDecoder<S>(option, enumOptions, useRealValues, emptyValue))}
        value={useRealValues ? (Array.isArray(value) ? value.map(String) : []) : selectedIndexes}
        aria-describedby={ariaDescribedByIds(id)}
        readOnly={readonly}
        invalid={required && value.length === 0}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
              return (
                <Checkbox
                  key={index}
                  id={optionId(id, index)}
                  name={htmlName || id}
                  value={enumOptionValueEncoder(option.value, index, useRealValues)}
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
