import React from "react";
import {
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  description,
  title,
  properties,
  required,
  schema,
  uiSchema,
  idSchema,
  registry,
}: ObjectFieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, S, F>(
    "TitleFieldTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    S,
    F
  >("DescriptionFieldTemplate", registry, uiOptions);
  return (
    <>
      {(uiOptions.title || title) && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(uiOptions.description || description) && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          schema={schema}
          uiSchema={uiSchema}
          description={uiOptions.description || description!}
          registry={registry}
        />
      )}
      <div className="ms-Grid" dir="ltr">
        <div className="ms-Grid-row">
          {properties.map((element) => element.content)}
        </div>
      </div>
    </>
  );
}
