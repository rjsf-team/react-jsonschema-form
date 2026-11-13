import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
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
import { Form } from 'react-bootstrap';
import type { FormControlProps } from 'react-bootstrap';

/** The props this theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes
 * `extraProps` to
 */
export type BootstrapBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> & {
  /** Props to spread on the `Form.Control` along with the ones the schema derives, or, without `Form.Control`'s own
   * `size`, `htmlSize`, `plaintext`, `isValid` and `isInvalid`, on the `Form.Range` of a `range` input. Its `pattern`,
   * `inputMode` and `accept` win over the derived ones
   */
  extraProps?: FormControlProps & Record<`data-${string}`, unknown>;
};

export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BootstrapBaseInputTemplateProps<T, S, F>) {
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
    registry,
    presentation,
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  // The `pattern`, `inputMode`, `accept` and `multiple` in `extraProps` count as the widget's own, over its props
  const { title, ...baseInputProps } = getBaseInputProps<T, S, F>({
    ...props,
    ...callerInputProps({ ...extraProps }),
    multiple: extraProps?.multiple ?? props.multiple,
  });
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
  const isInvalid = hasWidgetErrors<T, S, F>(props);
  const controlProps = {
    id,
    name: htmlName || id,
    placeholder,
    autoFocus: autofocus,
    required,
    disabled,
    title,
    readOnly: readonly,
    list: hasExamples ? examplesId(id) : undefined,
    ...inputProps,
    value: inputValue,
    onChange: onChangeOverride ?? handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    ...getControlAttributes<T, S, F>({ id, presentation }, hasExamples ? [examplesId(id)] : []),
  };
  const {
    size: _size,
    htmlSize: _htmlSize,
    plaintext: _plaintext,
    isValid: _isValid,
    isInvalid: _isInvalid,
    ...rangeProps
  } = controlProps;
  return (
    <>
      {inputProps.type === 'range' ? (
        // `Form.Range` takes Bootstrap's `form-range` class through its prefix, which a `ThemeProvider` can rename, and
        // renders a bare `<input>` without `Form.Control`'s own props, so its error state is the class `Form.Control`
        // would add
        <Form.Range
          {...rangeProps}
          className={[inputProps.className, isInvalid && 'is-invalid'].filter(Boolean).join(' ') || undefined}
        />
      ) : (
        <Form.Control isInvalid={isInvalid} {...controlProps} />
      )}
      {options.allowClearTextInputs && !readonly && !disabled && offersClearButton(inputValue, inputProps.type) && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
