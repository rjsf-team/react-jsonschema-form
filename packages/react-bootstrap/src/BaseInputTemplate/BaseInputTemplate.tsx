import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  examplesId,
  getControlAttributes,
  getExampleSuggestions,
  getInputProps,
  getNumericInputTitle,
  hasWidgetErrors,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    children,
    extraProps,
    registry,
    presentation,
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  const derivedInputProps = getInputProps<T, S, F>(schema, type, options);
  // `pattern` and `inputMode` are the two derived props a caller can also mean to set, so `extraProps` keeps either one
  // it carries. The title names the rule the derived `pattern` imposes, so a caller replacing that pattern drops the
  // title with it rather than describing a rule no longer in force
  const callerPattern = extraProps && 'pattern' in extraProps ? { pattern: extraProps.pattern } : undefined;
  const inputProps = {
    ...extraProps,
    ...derivedInputProps,
    ...callerPattern,
    ...(extraProps && 'inputMode' in extraProps ? { inputMode: extraProps.inputMode } : undefined),
  };
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);
  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue);
    },
    [onChange, options.emptyValue],
  );

  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  const isInvalid = hasWidgetErrors<T, S, F>(props);
  const controlProps = {
    id,
    name: htmlName || id,
    placeholder,
    autoFocus: autofocus,
    required,
    disabled,
    title: callerPattern ? undefined : getNumericInputTitle(derivedInputProps, registry.translateString),
    readOnly: readonly,
    list: hasExamples ? examplesId(id) : undefined,
    ...inputProps,
    value: value || value === 0 ? value : '',
    onChange: onChangeOverride ?? handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    ...getControlAttributes<T, S, F>({ id, presentation }, hasExamples ? [examplesId(id)] : []),
  };
  return (
    <>
      {inputProps.type === 'range' ? (
        // `Form.Range` takes Bootstrap's `form-range` class through its prefix, which a `ThemeProvider` can rename, and
        // has no `isInvalid`, so its error state is the class `Form.Control` would add
        <Form.Range
          {...controlProps}
          className={[inputProps.className, isInvalid && 'is-invalid'].filter(Boolean).join(' ') || undefined}
        />
      ) : (
        <Form.Control isInvalid={isInvalid} {...controlProps} />
      )}
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
