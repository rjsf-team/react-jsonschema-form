import React, { useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsValueForIndex,
  enumOptionsIndexForValue,
  optionId,
  titleId,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Checkbox, Flex, Input } from '@mantine/core';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
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
        onBlur(id, enumOptionsValueForIndex<S>(target.value, enumOptions, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionsValueForIndex<S>(target.value, enumOptions, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue]
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, true) as string[];

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId<T>(id)} required={required}>
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
        aria-describedby={ariaDescribedByIds<T>(id)}
        {...options}
        classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      >
        {Array.isArray(enumOptions) ? (
          <Flex mt='xs' direction={inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
            {enumOptions.map((option, i) => (
              <Checkbox
                key={i}
                id={optionId(id, i)}
                name={id}
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
      </Checkbox.Group>
    </>
  ) : null;
}
