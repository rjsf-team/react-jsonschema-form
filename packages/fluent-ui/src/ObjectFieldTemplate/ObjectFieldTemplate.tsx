import React from "react";
import { getUiOptions, ObjectFieldTemplateProps } from "@rjsf/utils";

const ObjectFieldTemplate = ({
  description,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
  registry,
}: ObjectFieldTemplateProps) => {
  const { DescriptionFieldTemplate, TitleFieldTemplate } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
  return (
    <>
      {(uiOptions.title || title) && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          description={description}
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
