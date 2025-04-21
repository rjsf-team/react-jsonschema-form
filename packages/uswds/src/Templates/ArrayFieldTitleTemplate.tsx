import React from "react";
import {
  TitleFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `ArrayFieldTitleTemplate` component renders a title for an array field.
 *
 * @param props - The `TitleFieldProps` for the component
 */
const ArrayFieldTitleTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  title,
  idSchema,
  required,
}: TitleFieldProps<T, S, F>) => {
  if (!title) {
    return null;
  }
  const id = `${idSchema.$id}__title`;
  return (
    <legend id={id} className="usa-legend">
      {title}
      {required && <span className="usa-label--required"> *</span>}
    </legend>
  );
};

export default ArrayFieldTitleTemplate;
