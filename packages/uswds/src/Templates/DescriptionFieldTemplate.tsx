import React from "react";
import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `DescriptionFieldTemplate` component renders a field's description.
 *
 * @param props - The `DescriptionFieldProps` for the component
 */
const DescriptionFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  description,
  idSchema,
}: DescriptionFieldProps<T, S, F>) => {
  if (!description) {
    return null;
  }

  const id = `${idSchema.$id}__description`;
  return (
    <span id={id} className="usa-hint">
      {description}
    </span>
  );
};

export default DescriptionFieldTemplate;
