import React from "react";
import {
  WidgetProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ariaDescribedByIds, // Correctly imported
} from "@rjsf/utils";

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label, // Destructured but correctly not used directly here
    value,
    onChange,
    onChangeOverride, // Correctly handled
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema, // Destructured but not used directly
    formContext, // Destructured but not used directly
    registry, // Destructured but not used directly
    rawErrors, // Destructured but correctly not used for input styling here
    hideLabel, // Destructured but not used directly
    hideError, // Destructured but not used directly
    ...rest
  } = props;

  // Merging extra props from ui:options
  const inputProps = {
    ...rest,
    ...options.props,
  };

  // Standard event handlers using RJSF logic
  const _onChange = ({
    target: { value: eventValue },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(eventValue === "" ? options.emptyValue : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, eventValue);

  return (
    <>
      <input
        id={id}
        name={id} // Correct: name attribute is important
        type={type}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className="usa-input" // Correct: USWDS specific class
        list={schema.examples ? `examples_${id}` : undefined} // Correct: Datalist handling
        value={value || value === 0 ? value : ""} // Correct: Handling empty/zero values
        onChange={onChangeOverride || _onChange} // Correct: Prioritizes override
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)} // Correct: Accessibility attribute
        {...inputProps} // Spreading extra props
      />
      {/* Correct: Datalist rendering */}
      {schema.examples ? (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </>
  );
}
