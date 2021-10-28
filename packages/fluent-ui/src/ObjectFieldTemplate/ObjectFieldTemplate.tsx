import React from "react";
import { ObjectFieldTemplateProps } from "@rjsf/core";

const ObjectFieldTemplate = ({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
}: ObjectFieldTemplateProps) => {
  return (
    <>
      {(uiSchema["ui:title"] || title) && (
        <TitleField
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
        />
      )}
      {description && (
        <DescriptionField
          id={`${idSchema.$id}-description`}
          description={description}
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
