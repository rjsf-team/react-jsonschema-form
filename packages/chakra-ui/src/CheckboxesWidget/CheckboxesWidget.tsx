import { CheckboxGroup, FieldsetRoot, Stack, Text } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
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
    hideLabel,
    rawErrors = [],
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));

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
      <CheckboxGroup
        onValueChange={(option) => onChange(enumOptionsValueForIndex<S>(option, enumOptions, emptyValue))}
        value={selectedIndexes}
        aria-describedby={ariaDescribedByIds(id)}
        readOnly={readonly}
        required={required}
        label={labelValue(label, hideLabel || !label)}
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
                  value={String(index)}
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
