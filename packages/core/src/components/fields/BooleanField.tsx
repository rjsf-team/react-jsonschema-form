import React from "react";
import {
  getWidget,
  getUiOptions,
  optionsList,
  FieldProps,
  FormContextType,
  EnumOptionsType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import isObject from "lodash/isObject";

/** The `BooleanField` component is used to render a field in the schema is boolean. It constructs `enumOptions` for the
 * two boolean values based on the various alternatives in the schema.
 *
 * @param props - The `FieldProps` for this template
 */
function BooleanField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldProps<T, S, F>) {
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
  const { widget = "checkbox", ...options } = getUiOptions<T, S, F>(uiSchema);
  const Widget = getWidget(schema, widget, widgets);

  let enumOptions: EnumOptionsType<S>[] | undefined;

  if (Array.isArray(schema.oneOf)) {
    enumOptions = optionsList<S>({
      oneOf: schema.oneOf
        .map((option) => {
          if (isObject(option)) {
            return {
              ...option,
              title: option.title || (option.const === true ? "Yes" : "No"),
            };
          }
          return undefined;
        })
        .filter((o: any) => o) as S[], // cast away the error that typescript can't grok is fixed
    } as unknown as S);
  } else {
    // We deprecated enumNames in v5. It's intentionally omitted from RSJFSchema type, so we need to cast here.
    const schemaWithEnumNames = schema as S & { enumNames?: string[] };
    const enums = schema.enum ?? [true, false];
    if (
      !schemaWithEnumNames.enumNames &&
      enums.length === 2 &&
      enums.every((v: any) => typeof v === "boolean")
    ) {
      enumOptions = [
        {
          value: enums[0],
          label: enums[0] ? "Yes" : "No",
        },
        {
          value: enums[1],
          label: enums[1] ? "Yes" : "No",
        },
      ];
    } else {
      enumOptions = optionsList<S>({
        enum: enums,
        // NOTE: enumNames is deprecated, but still supported for now.
        enumNames: schemaWithEnumNames.enumNames,
      } as unknown as S);
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
