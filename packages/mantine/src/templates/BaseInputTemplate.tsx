import { ChangeEvent, FocusEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  getInputProps,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { TextInput, NumberInput } from '@mantine/core';

import { cleanupOptions } from '../utils';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    type,
    schema,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    rawErrors,
    children,
  } = props;

  const inputProps = getInputProps<T, S, F>(schema, type, options, false);
  const themeProps = cleanupOptions(options);

  const handleNumberChange = useCallback((value: number | string) => onChange(value), [onChange]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const handler = onChangeOverride ? onChangeOverride : onChange;
      const value = e.target.value === '' ? (options.emptyValue ?? '') : e.target.value;
      handler(value);
    },
    [onChange, onChangeOverride, options],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onBlur(id, e.target && e.target.value);
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onFocus(id, e.target && e.target.value);
    },
    [onFocus, id],
  );

  const input =
    inputProps.type === 'number' || inputProps.type === 'integer' ? (
      <NumberInput
        id={id}
        name={id}
        label={labelValue(label || undefined, hideLabel, false)}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleNumberChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
        list={schema.examples ? examplesId<T>(id) : undefined}
        {...inputProps}
        {...themeProps}
        step={typeof inputProps.step === 'number' ? inputProps.step : 1}
        type='text'
        value={value}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
    ) : (
      <TextInput
        id={id}
        name={id}
        label={labelValue(label || undefined, hideLabel, false)}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
        list={schema.examples ? examplesId<T>(id) : undefined}
        {...inputProps}
        {...themeProps}
        value={value}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
    );

  return (
    <>
      {input}
      {children}
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(schema.default && !schema.examples.includes(schema.default) ? ([schema.default] as string[]) : [])
            .map((example) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
