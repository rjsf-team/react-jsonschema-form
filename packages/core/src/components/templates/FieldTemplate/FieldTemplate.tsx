import React from "react";
import { FieldTemplateProps } from "@rjsf/utils";

import Label from "./Label";
import WrapIfAdditional from "./WrapIfAdditional";

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<T = any, F = any>(
  props: FieldTemplateProps<T, F>
) {
  const {
    id,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }
  return (
    <WrapIfAdditional<T, F> {...props}>
      {displayLabel && <Label label={label} required={required} id={id} />}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
    </WrapIfAdditional>
  );
}
