import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  fieldLabelId,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
  labelValue,
  optionId,
  useOptionFocusHandlers,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { getChakra } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, readonly, onChange, onBlur, onFocus, label, presentation } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  const row = options ? options.inline : false;
  const selectValue: string[] = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []);

  const chakraProps = getChakra(options);
  const hasError = hasWidgetErrors<T, S, F>(props);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'group',
  );

  const drawsLabel = !hideLabel && !!label;
  const labelId = fieldLabelId(id);

  return (
    <FieldsetRoot
      mb={1}
      disabled={disabled || readonly}
      invalid={hasError}
      // Ark points the fieldset at a legend id of its own whether or not the legend renders, so the fieldset and the
      // group inside it are pointed at the legend drawn here, under the field's label id, or at nothing
      aria-labelledby={drawsLabel ? labelId : ''}
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
        aria-labelledby={groupAttributes['aria-labelledby'] ?? (drawsLabel ? labelId : '')}
        readOnly={readonly}
        invalid={hasError}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
              return (
                <Checkbox
                  // oxlint-disable-next-line react/no-array-index-key
                  key={index}
                  id={optionId(id, index)}
                  ids={{ hiddenInput: optionId(id, index) }}
                  name={htmlName || id}
                  value={domValues[index]}
                  disabled={disabled || itemDisabled || readonly}
                  onBlur={blurHandlers[index]}
                  onFocus={focusHandlers[index]}
                  inputProps={optionAttributes}
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
