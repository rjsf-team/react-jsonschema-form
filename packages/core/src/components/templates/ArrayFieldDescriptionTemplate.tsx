import React from "react";
import { ArrayFieldDescriptionProps } from "@rjsf/utils";

/** The `ArrayFieldDescriptionTemplate` component renders a `DescriptionFieldTemplate` with an `id` derived from
 * the `idSchema`.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate(
  props: ArrayFieldDescriptionProps
) {
  const { idSchema, description, registry } = props;
  if (!description) {
    return null;
  }
  const { DescriptionFieldTemplate } = registry.templates;
  const id = `${idSchema.$id}__description`;
  return (
    <DescriptionFieldTemplate
      id={id}
      description={description}
      registry={registry}
    />
  );
}
