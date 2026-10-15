import type { ChangeEvent, FocusEvent } from 'react';
import { Stack } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  fieldLabelId,
  getGroupAttributes,
  getOptionValueFormat,
  labelValue,
  optionId,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { Radio, RadioGroup } from '../components/ui/radio.tsx';
import { getChakra } from '../utils.ts';

export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    onChange,
    onBlur,
    onFocus,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleChange = ({ target: { value: enumValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleBlur = ({ target: { value: enumValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));
  const handleFocus = ({ target: { value: enumValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(enumValue, enumOptions, optionValueFormat, emptyValue));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat, null);

  const chakraProps = getChakra(options);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );
  // The group is pointed at the label this widget draws, where the plan names it by no other. With no label to point at,
  // it is left unnamed: Ark otherwise points it at a label id of its own that no element has, and ignores an undefined
  // override, so only an empty one stops it
  const labelId = fieldLabelId(id);
  const drawsLabel = !hideLabel && !!label;
  const optionIndexes = new Map(domValues.map((domValue, index) => [domValue, index]));

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      label={labelValue(label, !drawsLabel)}
      ids={{ label: labelId }}
      labelNamesNoControl
      {...chakraProps}
    >
      <RadioGroup
        // The group carries the field's id and each radio its option's, as core's do
        ids={{ root: id, itemHiddenInput: (domValue) => optionId(id, optionIndexes.get(domValue) ?? -1) }}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        value={selectValue}
        name={htmlName || id}
        {...groupAttributes}
        aria-labelledby={groupAttributes['aria-labelledby'] ?? (drawsLabel ? labelId : '')}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);

              return (
                <Radio
                  value={domValues[index]}
                  // oxlint-disable-next-line react/no-array-index-key
                  key={index}
                  disabled={disabled || itemDisabled || readonly}
                  inputProps={{ ...optionAttributes, autoFocus: autofocus && index === 0 }}
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
