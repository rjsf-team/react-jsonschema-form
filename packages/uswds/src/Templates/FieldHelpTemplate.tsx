import React from "react";
import {
  FieldHelpProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
const FieldHelpTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  idSchema,
  help,
}: FieldHelpProps<T, S, F>) => {
  if (!help) {
    return null;
  }
  const id = `${idSchema.$id}__help`;
  return (
    <span id={id} className="usa-hint">
      {help}
    </span>
  );
};

export default FieldHelpTemplate;
