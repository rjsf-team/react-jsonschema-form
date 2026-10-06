import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getOptionValueFormat,
  hasVisibleErrors,
  labelValue,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { getChakra } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, readonly, onChange, onBlur, onFocus, label, hideLabel, uiSchema } =
    props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  const row = options ? options.inline : false;
  const selectValue: string[] = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []);

  const chakraProps = getChakra({ uiSchema });
  const hasError = hasVisibleErrors(props);

  return (
    <FieldsetRoot mb={1} disabled={disabled || readonly} invalid={hasError} {...(chakraProps as any)}>
      {!hideLabel && label && <FieldsetLegend>{labelValue(label)}</FieldsetLegend>}
      <CheckboxGroup
        onValueChange={(option) =>
          onChange(enumOptionValueDecoder<S>(option, enumOptions, optionValueFormat, emptyValue))
        }
        value={selectValue}
        aria-describedby={ariaDescribedByIds(id)}
        readOnly={readonly}
        invalid={hasError}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled =
                Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value);
              return (
                <Checkbox
                  // oxlint-disable-next-line react/no-array-index-key
                  key={index}
                  id={optionId(id, index)}
                  name={htmlName || id}
                  value={domValues[index]}
                  disabled={disabled || itemDisabled || readonly}
                  onBlur={blurHandlers[index]}
                  onFocus={focusHandlers[index]}
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
