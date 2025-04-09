import React, { useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Radio, Flex } from '@mantine/core';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
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

  const handleChange = useCallback(
    (nextValue: any) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue]
  );

  const selected = enumOptionsIndexForValue<S>(value, enumOptions) as string;

  return (
    <Radio.Group
      id={id}
      name={id}
      value={selected}
      label={!hideLabel ? label : undefined}
      onChange={handleChange}
      required={required}
      readOnly={disabled || readonly}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      aria-describedby={ariaDescribedByIds<T>(id)}
      {...options}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
    >
      {Array.isArray(enumOptions) ? (
        <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
          {enumOptions.map((option, i) => (
            <Radio
              key={i}
              id={optionId(id, i)}
              value={String(i)}
              label={option.label}
              disabled={Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1}
              autoFocus={i === 0 && autofocus}
              onBlur={handleBlur}
              onFocus={handleFocus}
            />
          ))}
        </Flex>
      ) : null}
    </Radio.Group>
  );
}
