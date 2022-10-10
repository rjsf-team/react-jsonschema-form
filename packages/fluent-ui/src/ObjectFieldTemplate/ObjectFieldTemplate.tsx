import React from "react";
import {
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
} from "@rjsf/utils";

const ObjectFieldTemplate = ({
  description,
  title,
  properties,
  required,
  schema,
  uiSchema,
  idSchema,
  registry,
}: ObjectFieldTemplateProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate">(
    "TitleFieldTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<"DescriptionFieldTemplate">(
    "DescriptionFieldTemplate",
    registry,
    uiOptions
  );
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
};

export default ObjectFieldTemplate;
