import React from "react";
import {
  getWidget,
  getUiOptions,
  optionsList,
  FieldProps,
  RJSFSchemaDefinition,
  EnumOptionsType,
} from "@rjsf/utils";
import isObject from "lodash/isObject";

/** The `BooleanField` component is used to render a field in the schema is boolean. It constructs `enumOptions` for the
 * two boolean values based on the various alternatives in the schema.
 *
 * @param props - The `FieldProps` for this template
 */
function BooleanField<T = any, F = any>(props: FieldProps<T, F>) {
  const {
    schema,
    name,
    uiSchema,
    idSchema,
    formData,
    registry,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onFocus,
    onBlur,
    rawErrors,
  } = props;
  const { title } = schema;
  const { widgets, formContext } = registry;
  const { widget = "checkbox", ...options } = getUiOptions<T, F>(uiSchema);
  const Widget = getWidget(schema, widget, widgets);

  let enumOptions: EnumOptionsType[] | undefined;

  if (Array.isArray(schema.oneOf)) {
    enumOptions = optionsList({
      oneOf: schema.oneOf
        .map((option: RJSFSchemaDefinition) => {
          if (isObject(option)) {
            return {
              ...option,
              title: option.title || (option.const === true ? "Yes" : "No"),
            };
          }
          return undefined;
        })
        .filter((o) => o) as RJSFSchemaDefinition[], // cast away the error that typescript can't grok is fixed
    });
  } else {
    schema.enum = schema.enum ?? [true, false];
    if (
      schema.enum &&
      schema.enum.length === 2 &&
      schema.enum.every((v) => typeof v === "boolean")
    ) {
      enumOptions = [
        { value: schema.enum[0], label: schema.enum[0] ? "Yes" : "No" },
        { value: schema.enum[1], label: schema.enum[1] ? "Yes" : "No" },
      ];
    } else {
      enumOptions = optionsList({
        enum: schema.enum,
      });
    }
  }

  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={idSchema && idSchema.$id}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      label={title === undefined ? name : title}
      value={formData}
      required={required}
      disabled={disabled}
      readonly={readonly}
      registry={registry}
      formContext={formContext}
      autofocus={autofocus}
      rawErrors={rawErrors}
    />
  );
}

export default BooleanField;
