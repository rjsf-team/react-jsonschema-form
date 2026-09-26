import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import { Radio, Flex } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, useGroupAriaProps, visibleErrorText } from '../utils.tsx';

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
  const { id, htmlName, value, required, disabled, readonly, autofocus, options, onChange, onBlur, onFocus } = props;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, optionValueFormat],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, optionValueFormat],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, optionValueFormat],
  );

  const selected = enumOptionsIndexForValue<S>(value, enumOptions) as string;

  const groupAriaProps = useGroupAriaProps('RadioGroup', props);
  const describedBy = ariaDescribedByIds(id);

  return (
    <Radio.Group
      id={id}
      name={htmlName || id}
      value={selected}
      onChange={handleChange}
      required={required}
      readOnly={disabled || readonly}
      error={visibleErrorText(props)}
      {...themeProps}
      {...groupAriaProps}
      {...getDescriptionProps(props)}
    >
      {Array.isArray(enumOptions) ? (
        <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
          {enumOptions.map((option, i) => (
            <Radio
              key={String(option.value)}
              id={optionId(id, i)}
              value={enumOptionValueEncoder(option.value, i, optionValueFormat)}
              label={option.label}
              disabled={Array.isArray(enumDisabled) && enumDisabled.includes(option.value)}
              autoFocus={i === 0 && autofocus}
              onBlur={handleBlur}
              onFocus={handleFocus}
              aria-describedby={describedBy}
            />
          ))}
        </Flex>
      ) : null}
    </Radio.Group>
  );
}
