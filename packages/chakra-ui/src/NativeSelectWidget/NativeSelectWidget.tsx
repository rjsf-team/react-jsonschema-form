import type { ChangeEvent, FocusEvent } from 'react';
import { useMemo } from 'react';
import { NativeSelect } from '@chakra-ui/react';
import type { FormContextType, IndexedEnumOptionType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  groupEnumOptions,
  hasWidgetErrors,
  isEnumOptionsGroup,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
  widgetAriaProps,
  widgetDrawsLabelText,
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    options,
    label,
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
    schema,
  } = props;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
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

  const chakraProps = getChakra(options);

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
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={id}
      {...chakraProps}
    >
      <SelectedOptionDescription {...props} />
      <NativeSelect.Root>
        <NativeSelect.Field
          id={id}
          name={htmlName || id}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          autoFocus={autofocus}
          value={formValue}
          {...widgetAriaProps(props)}
        >
          {showPlaceholderOption ? (
            <option value='' disabled hidden>
              {placeholder || ''}
            </option>
          ) : undefined}
          {groupedOptions.map((item) =>
            isEnumOptionsGroup<S>(item) ? (
              <optgroup key={`optgroup-${item.label}`} label={item.label}>
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
