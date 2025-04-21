import React from "react";
import {
  TitleFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `TitleFieldTemplate` component renders the title of a field
 *
 * @param props - The `TitleFieldProps` for the component
 */
const TitleFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  title,
  required,
}: TitleFieldProps<T, S, F>) => {
  // Use legend for root object/array titles (usually rendered within fieldset), label otherwise
  const Tag = id === "root__title" ? "legend" : "label";
  const className = Tag === "legend" ? "usa-legend" : "usa-label";

  return (
    <Tag id={id} className={className}>
      {title}
      {required && <span className="usa-label--required"> *</span>}
    </Tag>
  );
};

export default TitleFieldTemplate;
