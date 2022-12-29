import React from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import {
  getInputProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    formContext,
    registry,
    ...textFieldProps
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const { step, min, max, ...rest } = inputProps;
  const otherProps = {
    inputProps: {
      step,
      min,
      max,
      ...(schema.examples ? { list: `examples_${id}` } : undefined),
    },
    ...rest,
  };
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const { schemaUtils } = registry;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);

  return (
    <>
      <TextField
        id={id}
        name={id}
        placeholder={placeholder}
        label={displayLabel ? label || schema.title : false}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        {...otherProps}
        value={value || value === 0 ? value : ""}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...(textFieldProps as TextFieldProps)}
      />
      {schema.examples && (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
