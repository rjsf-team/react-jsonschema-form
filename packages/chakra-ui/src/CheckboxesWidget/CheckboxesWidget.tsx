import { chakra, CheckboxGroup, FieldsetRoot, Stack, Text, useSlotRecipe } from '@chakra-ui/react';
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
import { RequiredMarker } from '../components/ui/field.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, readonly, required, autofocus, onChange, onBlur, onFocus, label } =
    props;
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

  const legendStyles = useSlotRecipe({ key: 'fieldset' })().legend;

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return (
    <FieldsetRoot
      mb={1}
      disabled={disabled || readonly}
      invalid={hasError}
      // Ark points the fieldset at a legend id of its own, which never renders, so it is pointed at nothing: only the
      // group inside it, which carries the field's id, is named by the label
      aria-labelledby={labelledByOrNone(undefined, false)}
      {...chakraProps}
    >
      {drawsLabel && (
        // Styled as the recipe's legend, but not drawn as a `<legend>`, which would name the fieldset too, so a screen
        // reader entering the group would hear its name twice
        <chakra.div
          id={labelId}
          className='fieldset__legend'
          css={legendStyles}
          data-disabled={disabled || readonly ? '' : undefined}
        >
          {labelValue(label)}
          {required && <RequiredMarker ms={1} />}
        </chakra.div>
      )}
      <CheckboxGroup
        // The group carries the field's id and each checkbox's `<input>` its option's, as core's do
        id={id}
        onValueChange={(option) =>
          onChange(enumOptionValueDecoder<S>(option, enumOptions, optionValueFormat, emptyValue))
        }
        value={selectValue}
        {...groupAttributes}
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
