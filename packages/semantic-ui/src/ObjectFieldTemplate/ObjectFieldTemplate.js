/* eslint-disable react/prop-types */
import React from "react";

function ObjectFieldTemplate({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
}) {
  const fieldTitle = uiSchema["ui:title"] || title;
  const fieldDescription = uiSchema["ui:description"] || description;
  return (
    <React.Fragment>
      {(fieldTitle) && (
        <TitleField
          id={`${idSchema.$id}-title`}
          title={fieldTitle}
          options={uiSchema["ui:options"]}
          required={required}
        />
      )}
      {(fieldDescription) && (
        <DescriptionField
          id={`${idSchema.$id}-description`}
          description={fieldDescription}
        />
      )}
      {properties.map(prop => prop.content)}
    </React.Fragment>
  );
}

export default ObjectFieldTemplate;
