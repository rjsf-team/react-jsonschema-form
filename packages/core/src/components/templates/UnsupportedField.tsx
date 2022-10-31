import React from "react";
import {
  FormContextType,
  UnsupportedFieldProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `UnsupportedField` component is used to render a field in the schema is one that is not supported by
 * react-jsonschema-form.
 *
 * @param props - The `FieldProps` for this template
 */
function UnsupportedField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: UnsupportedFieldProps<T, S, F>) {
  const { schema, idSchema, reason } = props;
  return (
    <div className="unsupported-field">
      <p>
        Unsupported field schema
        {idSchema && idSchema.$id && (
          <span>
            {" for"} field <code>{idSchema.$id}</code>
          </span>
        )}
        {reason && <em>: {reason}</em>}.
      </p>
      {schema && <pre>{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
}

export default UnsupportedField;
