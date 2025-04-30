import { ChangeEvent, FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  FormContextType,
  getInputProps,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { FormGroup, Label, TextInput, TextInputProps } from '@trussworks/react-uswds';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and options only.
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
    required,
    label,
    hideLabel,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    schema,
    type,
    rawErrors = [],
  } = props;

  // Use getInputProps to handle common input props
  const inputProps = getInputProps<T, S, F>(schema, type, options);

  const _onChange = ({ target: { value: eventValue } }: ChangeEvent<HTMLInputElement>) => {
    onChange(eventValue === '' ? options.emptyValue : eventValue);
  };
  const _onBlur = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, eventValue);
  const inputType = (inputProps.type || type) as TextInputProps['type'];

  const hasError = rawErrors.length > 0;

  return (
    <FormGroup error={hasError}>
      {labelValue(
        <Label htmlFor={id} error={hasError}>
          {label || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </Label>,
        hideLabel,
      )}
      {/* If description/help text is needed, it should go here */}
      <TextInput
        id={id}
        name={id}
        className={hasError ? 'usa-input--error' : ''}
        list={schema.examples ? examplesId<T>(id) : undefined}
        {...inputProps}
        type={inputType}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || _onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
      {/* Datalist remains outside FormGroup or adjust as needed */}
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </FormGroup>
  );
}
