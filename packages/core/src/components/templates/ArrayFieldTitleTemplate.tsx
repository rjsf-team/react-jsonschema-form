import React from "react";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTitleProps,
  TemplatesType,
} from "@rjsf/utils";

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `idSchema`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<T = any, F = any>(
  props: ArrayFieldTitleProps
) {
  const { idSchema, title, uiSchema, required, registry } = props;
  if (!title) {
    return null;
  }
  const options = getUiOptions<T, F>(uiSchema);
  const TitleFieldTemplate: TemplatesType<T, F>["TitleFieldTemplate"] =
    getTemplate<"TitleFieldTemplate", T, F>(
      "TitleFieldTemplate",
      registry,
      options
    );
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
