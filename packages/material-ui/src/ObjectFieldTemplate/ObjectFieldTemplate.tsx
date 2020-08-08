import React from 'react';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

import { makeStyles } from '@material-ui/styles';
import { UiSchema, ObjectFieldTemplateProps, utils } from '@rjsf/core';
import { JSONSchema7 } from 'json-schema';

const { getUiOptions } = utils;

type AddButtonProps = {
  onClick: (e?: any) => void,
  disabled: boolean
};

const AddButton = (props: AddButtonProps) => (
  <Button {...props} color="secondary">
    <AddIcon /> Add Item
  </Button>
);

const useStyles = makeStyles({
  root: {
    marginTop: 10,
  },
});

const canExpand = function canExpand(formData: object, schema: JSONSchema7, uiSchema: UiSchema) {
  if (!schema.additionalProperties) {
    return false;
  }
  const uiOptions = getUiOptions(uiSchema) || {};
  const expandable = uiOptions['expandable'];
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
};

const ObjectFieldTemplate = ({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
  formData,
  disabled,
  readonly,
  onAddClick,
  schema
}: ObjectFieldTemplateProps) => {
  const classes = useStyles();

  return (
    <>
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
      <Grid container={true} spacing={2} className={classes.root}>
        {properties.map((element: any, index: number) => (
          <Grid
            item={true}
            xs={12}
            key={index}
            style={{ marginBottom: '10px' }}
          >
            {element.content}
          </Grid>
        ))}
      </Grid>
      {canExpand(formData, schema, uiSchema) && (
        <Grid container justify="flex-end">
          <Grid item={true}>
            <AddButton
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default ObjectFieldTemplate;
