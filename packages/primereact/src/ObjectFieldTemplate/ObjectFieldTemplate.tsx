import { ObjectFieldTemplateProps } from "@rjsf/core";
import cn from "clsx";
import React from "react";

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
          title={uiSchema["ui:title"] || title}
          required={required}
        />
      )}
      {description && (
        <DescriptionField
          id={`${idSchema.$id}-description`}
          description={description}
        />
      )}
      <div className="flex flex-column gap-2">
        {properties.map((element: any, index: number) => (
          <div
            key={index}
            className={cn("mb-2", element.hidden ? "d-none" : undefined)}
          >
            {element.content}
          </div>
        ))}
      </div>
    </>
  );
};

export default ObjectFieldTemplate;
