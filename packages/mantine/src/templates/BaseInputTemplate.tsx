import React from 'react';
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

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
  } = props;

  const inputProps = getInputProps<T, S, F>(schema, type, options, false);

  const handleNumberChange = (value: number | string) => onChange(value);

  const handleChange = onChangeOverride
    ? onChangeOverride
    : (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value === '' ? options.emptyValue ?? '' : e.target.value);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => onBlur(id, e.target && e.target.value);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => onFocus(id, e.target && e.target.value);

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
        value={value}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
    );

  return (
    <>
      {input}
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
