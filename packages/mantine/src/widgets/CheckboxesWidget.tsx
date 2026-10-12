import { useCallback } from 'react';
import { Checkbox, Flex } from '@mantine/core';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  enumOptionSelectedValue,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, GroupOptions, useGroupAriaProps } from '../utils.tsx';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, value, required, disabled, readonly, autofocus, options, onChange, onBlur, onFocus } = props;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const themeProps = cleanupOptions(options);
  const fieldDisabled = disabled || readonly;

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!fieldDisabled && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, fieldDisabled, enumOptions, emptyValue, optionValueFormat],
  );

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  // Compared against the options' own values, which are encoded in the `optionValueFormat` rather than always indexes
  const selectedValues: string[] = enumOptionSelectedValue(value, enumOptions, true, optionValueFormat, []);

  const { groupProps, optionProps } = useGroupAriaProps('CheckboxGroup', props);

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <Checkbox.Group
      id={id}
      value={selectedValues}
      onChange={handleChange}
      required={required}
      readOnly={fieldDisabled}
      {...themeProps}
      {...groupProps}
      {...getDescriptionProps(props)}
    >
      <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
        <GroupOptions optionProps={optionProps}>
          {(describedOptionProps) =>
            enumOptions.map((option, i) => (
              <Checkbox
                // oxlint-disable-next-line react/no-array-index-key
                key={i}
                id={optionId(id, i)}
                name={htmlName || id}
                value={domValues[i]}
                label={option.label}
                disabled={fieldDisabled || enumOptionsIsDisabled(option.value, enumDisabled)}
                autoFocus={i === 0 && autofocus}
                onBlur={blurHandlers[i]}
                onFocus={focusHandlers[i]}
                {...describedOptionProps}
              />
            ))
          }
        </GroupOptions>
      </Flex>
    </Checkbox.Group>
  ) : null;
}
