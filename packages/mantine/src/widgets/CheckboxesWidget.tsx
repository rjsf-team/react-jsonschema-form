import { FocusEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
  optionId,
  titleId,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Checkbox, Flex, Input } from '@mantine/core';

import { cleanupOptions } from '../utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const useRealValues = !!options.useRealOptionValues;
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, useRealValues, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, useRealValues],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, useRealValues],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, useRealValues],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, true) as string[];

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId(id)} required={required}>
          {label}
        </Input.Label>
      )}
      <Checkbox.Group
        id={id}
        value={selectedIndexes}
        onChange={handleChange}
        required={required}
        readOnly={disabled || readonly}
        error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
        aria-describedby={ariaDescribedByIds(id)}
        {...themeProps}
      >
        {Array.isArray(enumOptions) ? (
          <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
            {enumOptions.map((option, i) => (
              <Checkbox
                key={i}
                id={optionId(id, i)}
                name={htmlName || id}
                value={enumOptionValueEncoder(option.value, i, useRealValues)}
                label={option.label}
                disabled={Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1}
                autoFocus={i === 0 && autofocus}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
            ))}
          </Flex>
        ) : null}
      </Checkbox.Group>
    </>
  ) : null;
}
