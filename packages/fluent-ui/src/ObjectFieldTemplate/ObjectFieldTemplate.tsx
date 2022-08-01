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
  const { DescriptionField, TitleField } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
  return (
    <>
      {(uiOptions.title || title) && (
        <TitleField
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionField
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
