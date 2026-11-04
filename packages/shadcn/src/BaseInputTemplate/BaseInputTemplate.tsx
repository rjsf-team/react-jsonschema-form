import type { ChangeEvent, FocusEvent, InputHTMLAttributes, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  examplesId,
  getControlAttributes,
  getExampleSuggestions,
  callerInputProps,
  getBaseInputProps,
  hasWidgetErrors,
  offersClearButton,
  toInputValue,
} from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';

/** The props this theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes
 * `extraProps` to
 */
export type ShadcnBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> & {
  /** Props to spread on the input along with the ones the schema derives. Its `pattern`, `inputMode` and `accept` win
   * over the derived ones
   */
  extraProps?: InputHTMLAttributes<HTMLInputElement>;
};

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
>(props: ShadcnBaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    required,
    readonly,
    disabled,
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
    className,
    registry,
    presentation,
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  // The `pattern`, `inputMode`, `accept` and `multiple` in `extraProps` count as the widget's own, over its props
  const { title, ...baseInputProps } = getBaseInputProps<T, S, F>({ ...props, ...callerInputProps({ ...extraProps }) });
  const inputProps = { ...extraProps, ...baseInputProps };
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

  const inputValue = toInputValue(value);
  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  return (
    <div className='p-0.5'>
      <Input
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className)}
        list={hasExamples ? examplesId(id) : undefined}
        title={title}
        {...inputProps}
        value={inputValue}
        onChange={onChangeOverride ?? handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...getControlAttributes<T, S, F>({ id, presentation }, hasExamples ? [examplesId(id)] : [])}
      />
      {options.allowClearTextInputs && !readonly && !disabled && offersClearButton(inputValue, inputProps.type) && (
        <ClearButton onClick={handleClear} registry={registry} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </div>
  );
}
