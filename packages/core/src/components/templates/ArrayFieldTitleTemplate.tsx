import React from "react";
import { ArrayFieldTitleProps } from "@rjsf/utils";

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `idSchema`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate(props: ArrayFieldTitleProps) {
  const { idSchema, title, uiSchema, required, registry } = props;
  if (!title) {
    return null;
  }
  const { TitleFieldTemplate } = registry.templates;
  const id = `${idSchema.$id}__title`;
  return (
    <TitleFieldTemplate
      id={id}
      title={title}
      required={required}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
