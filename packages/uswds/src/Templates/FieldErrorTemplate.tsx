import React from "react";
import {
  FieldErrorProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `FieldErrorTemplate` component renders the errors for a field
 *
 * @param props - The `FieldErrorProps` for the component
 */
const FieldErrorTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  errors,
  idSchema,
}: FieldErrorProps<T, S, F>) => {
  if (!errors || errors.length === 0) {
    return null;
  }
  const id = `${idSchema.$id}__error`;

  return (
    <span id={id} className="usa-error-message" role="alert">
      {errors.map((error, i: number) => (
        <span key={i}>{error}</span> // USWDS error message usually contains one message, but we map just in case
      ))}
    </span>
  );
};

export default FieldErrorTemplate;
