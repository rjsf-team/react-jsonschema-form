import type { ChangeEvent, FocusEvent } from 'react';
import { useMemo } from 'react';
import { NativeSelect } from '@chakra-ui/react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  groupEnumOptions,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

/**
 * NativeSelectWidget is a React component that renders a native select input.
 *
 * @param {T} T - The type of the value.
 * @param {S} S - The type of the schema.
 * @param {F} F - The type of the form context.
 * @param {WidgetProps<T, S, F>} props - The props for the component.
 *
 * @returns {JSX.Element} - The rendered component.
 */
export default function NativeSelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    options,
    label,
    hideLabel,
    placeholder,
    multiple,
    required,
    disabled,
    readonly,
    value,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    schema,
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;

  const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) =>
    onChange(enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const handleBlur = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const handleFocus = ({ target }: FocusEvent<HTMLSelectElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(target?.value, enumOptions, emptyValue));

  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const groupedOptions = useMemo(
    () => groupEnumOptions<S>(enumOptions, optgroups, enumDisabled),
    [enumDisabled, enumOptions, optgroups],
  );

  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions, false);
  const formValue = typeof selectedIndex !== 'undefined' ? selectedIndex.toString() : '';

  const chakraProps = getChakra({ uiSchema });

  function renderOption(option: IndexedEnumOptionType<S>) {
    return (
      <option key={option.index} value={String(option.index)} disabled={option.disabled}>
        {option.label}
      </option>
    );
  }

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <SelectedOptionDescription {...props} />
      <NativeSelect.Root>
        <NativeSelect.Field
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          autoFocus={autofocus}
          value={formValue}
          aria-describedby={ariaDescribedByIds(id)}
        >
          {showPlaceholderOption ? (
            <option value='' disabled hidden>
              {placeholder || ''}
            </option>
          ) : undefined}
          {groupedOptions.map((item) =>
            isEnumOptionsGroup<S>(item) ? (
              <optgroup key={item.label} label={item.label}>
                {item.options.map(renderOption)}
              </optgroup>
            ) : (
              renderOption(item)
            ),
          )}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field>
  );
}
