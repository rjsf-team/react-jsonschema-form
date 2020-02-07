/* eslint-disable react/prop-types */
import React from 'react';

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
  return (<div>
    {(uiSchema['ui:title'] || title) && (
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
    {properties.map((prop) => prop.content)}
  </div>);
}

export default ObjectFieldTemplate;
