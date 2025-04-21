import React from "react";
import {
  UnsupportedFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils";

/** The `UnsupportedFieldTemplate` component is used to render a field in the schema is is not supported by the
 * renderer. It will display a warning message asking the developer to specify a widget for the field.
 *
 * @param props - The `UnsupportedFieldProps` for the component
 */
const UnsupportedFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  idSchema,
  reason,
  registry,
}: UnsupportedFieldProps<T, S, F>) => {
  const { translateString } = registry;
  return (
    <div className="usa-alert usa-alert--warning unsupported-field">
      <div className="usa-alert__body">
        <p className="usa-alert__text">
          {translateString(TranslatableString.UnsupportedField, [
            String(schema.type),
          ])}{" "}
          {reason && <i>({reason})</i>}.{" "}
          {idSchema && idSchema.$id && (
            <span>
              {translateString(TranslatableString.MaybeAddWidget, [idSchema.$id])}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default UnsupportedFieldTemplate;
