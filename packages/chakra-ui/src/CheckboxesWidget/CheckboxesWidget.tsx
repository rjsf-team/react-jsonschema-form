import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getGroupLabelling,
  getOptionValueFormat,
  hasWidgetErrors,
  labelValue,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, readonly, autofocus, onChange, onBlur, onFocus, label } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  const row = options ? options.inline : false;
  const selectValue: string[] = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []);

  const chakraProps = getChakra(options);
  const hasError = hasWidgetErrors<T, S, F>(props);
  const {
    drawsLabel,
    labelId,
    group: groupAttributes,
    option: optionAttributes,
  } = getGroupLabelling<T, S, F>(props, 'group');

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return (
    <FieldsetRoot
      mb={1}
      disabled={disabled || readonly}
      invalid={hasError}
      // Ark points the fieldset at a legend id of its own whether or not the legend renders, so it is pointed at the
      // legend drawn here, under the field's label id, or at nothing
      aria-labelledby={labelledByOrNone(undefined, drawsLabel, labelId)}
      {...chakraProps}
    >
      {drawsLabel && <FieldsetLegend id={labelId}>{labelValue(label)}</FieldsetLegend>}
      <CheckboxGroup
        // The group carries the field's id and each checkbox's `<input>` its option's, as core's do
        id={id}
        onValueChange={(option) =>
          onChange(enumOptionValueDecoder<S>(option, enumOptions, optionValueFormat, emptyValue))
        }
        value={selectValue}
        {...groupAttributes}
        aria-labelledby={groupAttributes['aria-labelledby'] ?? ''}
        readOnly={readonly}
        invalid={hasError}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
              const inputId = optionId(id, index);
              return (
                <Checkbox
                  // oxlint-disable-next-line react/no-array-index-key
                  key={index}
                  id={inputId}
                  ids={{ hiddenInput: inputId }}
                  name={htmlName || id}
                  value={domValues[index]}
                  disabled={disabled || itemDisabled || readonly}
                  onBlur={blurHandlers[index]}
                  onFocus={focusHandlers[index]}
                  inputProps={{ ...optionAttributes, autoFocus: index === autofocusIndex }}
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
