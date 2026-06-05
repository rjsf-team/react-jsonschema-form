import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { Input } from '@chakra-ui/react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, examplesId, labelValue, getInputProps } from '@rjsf/utils';

import { Field } from '../components/ui/field';
import { getChakra } from '../utils';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
    type,
    value,
    label,
    hideLabel,
    schema,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    required,
    readonly,
    rawErrors,
    autofocus,
    placeholder,
    disabled,
    uiSchema,
    registry,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { ClearButton } = registry.templates.ButtonTemplates;

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);
  const onClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  const chakraProps = getChakra({ uiSchema });

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
      <Input
        id={id}
        name={htmlName || id}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        autoFocus={autofocus}
        placeholder={placeholder}
        {...inputProps}
        list={schema.examples ? examplesId(id) : undefined}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={onClear} />
      )}
      <SchemaExamples id={id} schema={schema} />
    </Field>
  );
}
