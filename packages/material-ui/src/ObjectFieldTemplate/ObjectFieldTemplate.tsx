import React from 'react';
import { ObjectFieldTemplateProps, utils } from '@rjsf/core';

import { useMuiComponent } from '../MuiComponentContext';
import AddButton from '../AddButton/AddButton';

const { canExpand } = utils;

const ObjectFieldTemplate = ({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  disabled,
  readonly,
  uiSchema,
  idSchema,
  schema,
  formData,
  onAddClick,
}: ObjectFieldTemplateProps) => {
  const { Grid } = useMuiComponent();
  return (
    <>
      {(uiSchema['ui:title'] || title) && (
        <TitleField id={`${idSchema.$id}-title`} title={title} required={required} />
      )}
      {description && <DescriptionField id={`${idSchema.$id}-description`} description={description} />}
      <Grid container={true} spacing={2} style={{ marginTop: '10px' }}>
        {properties.map((element, index) =>
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <Grid item={true} xs={12} key={index} style={{ marginBottom: '10px' }}>
              {element.content}
            </Grid>
          )
        )}
        {canExpand(schema, uiSchema, formData) && (
          <Grid container justifyContent="flex-end">
            <Grid item={true}>
              <AddButton
                className="object-property-expand"
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default ObjectFieldTemplate;
