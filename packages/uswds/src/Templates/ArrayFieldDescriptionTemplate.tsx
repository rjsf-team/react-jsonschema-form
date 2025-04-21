import React from "react";
import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `ArrayFieldDescriptionTemplate` component renders a description for an array field.
 *
 * @param props - The `DescriptionFieldProps` for the component
 */
const ArrayFieldDescriptionTemplate = <
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

export default ArrayFieldDescriptionTemplate;
