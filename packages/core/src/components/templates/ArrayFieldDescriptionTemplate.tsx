import React from "react";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldDescriptionProps,
} from "@rjsf/utils";

/** The `ArrayFieldDescriptionTemplate` component renders a `DescriptionFieldTemplate` with an `id` derived from
 * the `idSchema`.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<T = any, F = any>(
  props: ArrayFieldDescriptionProps
) {
  const { idSchema, description, registry, uiSchema } = props;
  if (!description) {
    return null;
  }
  const options = getUiOptions<T, F>(uiSchema);
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    F
  >("DescriptionFieldTemplate", registry, options);
  const id = `${idSchema.$id}__description`;
  return (
    <DescriptionFieldTemplate
      id={id}
      description={description}
      registry={registry}
    />
  );
}
