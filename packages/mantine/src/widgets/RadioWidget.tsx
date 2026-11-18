import { useCallback } from 'react';
import { Radio, Flex } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import {
  cleanupOptions,
  getDescriptionProps,
  GroupOptions,
  groupExcludedKeys,
  useGroupAriaProps,
  getRequiredProps,
} from '../utils.tsx';

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
  const { id, htmlName, value, disabled, readonly, autofocus, options, onChange, onBlur, onFocus } = props;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const themeProps = cleanupOptions(options, props, groupExcludedKeys);
  const fieldDisabled = disabled || readonly;

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!fieldDisabled && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, fieldDisabled, enumOptions, emptyValue, optionValueFormat],
  );

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  // Compared against the options' own values, which are encoded in the `optionValueFormat` rather than always indexes
  const selected: string | undefined = enumOptionSelectedValue(value, enumOptions, false, optionValueFormat);

  const { groupProps, optionProps } = useGroupAriaProps('RadioGroup', props);

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
  return (
    <Radio.Group
      id={id}
      name={htmlName || id}
      value={selected}
      onChange={handleChange}
      {...getRequiredProps<T, S, F>(props)}
      readOnly={fieldDisabled}
      {...themeProps}
      {...groupProps}
      {...getDescriptionProps(props)}
    >
      {Array.isArray(enumOptions) ? (
        <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
          <GroupOptions optionProps={optionProps}>
            {(describedOptionProps) =>
              enumOptions.map((option, i) => (
                <Radio
                  // oxlint-disable-next-line react/no-array-index-key
                  key={i}
                  id={optionId(id, i)}
                  value={domValues[i]}
                  label={option.label}
                  disabled={fieldDisabled || enumOptionsIsDisabled(option.value, enumDisabled)}
                  autoFocus={i === autofocusIndex}
                  onBlur={blurHandlers[i]}
                  onFocus={focusHandlers[i]}
                  {...describedOptionProps}
                />
              ))
            }
          </GroupOptions>
        </Flex>
      ) : null}
    </Radio.Group>
  );
}
