import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, examplesId, getInputProps, getNumericInputTitle, hasVisibleErrors } from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
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
  rawErrors,
  hideError,
  children,
  extraProps,
  className,
  registry,
}: BaseInputTemplateProps<T, S, F>) {
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

  return (
    <div className='p-0.5'>
      <Input
        id={id}
        name={htmlName || id}
        type={type}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={cn(
          { 'border-destructive focus-visible:ring-0': hasVisibleErrors({ rawErrors, hideError }) },
          className,
        )}
        list={schema.examples ? examplesId(id) : undefined}
        title={callerPattern ? undefined : getNumericInputTitle(derivedInputProps, registry.translateString)}
        {...inputProps}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton onClick={handleClear} registry={registry} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} />
    </div>
  );
}
