import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  examplesId,
  getExampleSuggestions,
  getInputProps,
  getNumericInputTitle,
} from '@rjsf/utils';

/** The `BaseInputTemplate` component is a template for rendering basic input elements
 * with DaisyUI styling. It's used as the foundation for various input types in forms.
 *
 * Features:
 * - Wraps input in DaisyUI's form-control for proper spacing
 * - Uses DaisyUI's input and input-bordered classes for styling
 * - Handles common input properties like disabled and readonly states
 * - Processes input props based on schema type and options
 * - Supports schema examples with datalist
 * - Handles onChange, onBlur, and onFocus events
 *
 * @param props - The `WidgetProps` for the component
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    multiple,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    onChangeOverride,
    options,
    schema,
    type,
    placeholder,
    registry,
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;

  const inputProps = getInputProps<T, S, F>(schema, type, options);
  let className = 'input input-bordered w-full';
  let isMulti = multiple;
  if (type === 'file') {
    isMulti = schema.type === 'array' || Boolean(options.multiple);
    className = 'file-input';
  }
  // Extract step, min, max, accept from inputProps
  const { step, min, max, accept, ...rest } = inputProps;
  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  const htmlInputProps = { step, min, max, accept, ...(hasExamples ? { list: examplesId(id) } : undefined) };

  const handleChange = useCallback(
    ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
      onChange(newValue === '' ? options.emptyValue : newValue),
    [onChange, options],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => onBlur?.(id, target.value),
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => onFocus?.(id, target.value),
    [onFocus, id],
  );

  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue);
    },
    [onChange, options.emptyValue],
  );

  return (
    <>
      <div className='form-control'>
        <div style={{ position: 'relative' }}>
          <input
            id={id}
            name={htmlName || id}
            value={value || value === 0 ? value : ''}
            placeholder={placeholder}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            className={className}
            multiple={isMulti}
            title={getNumericInputTitle(inputProps, registry.translateString)}
            {...rest}
            {...htmlInputProps}
            onChange={onChangeOverride || handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            aria-describedby={ariaDescribedByIds(id, hasExamples)}
          />
          {options.allowClearTextInputs && !readonly && !disabled && value && (
            <ClearButton registry={registry} onClick={handleClear} />
          )}
        </div>
      </div>
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
