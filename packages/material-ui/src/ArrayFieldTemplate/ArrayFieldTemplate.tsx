import React from 'react';

import { ArrayFieldTemplateProps, IdSchema, utils } from '@rjsf/core';

import AddButton from '../AddButton/AddButton';
import { useMuiComponent } from '../MuiComponentContext';

const { isMultiSelect, getDefaultRegistry } = utils;

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { schema, registry = getDefaultRegistry() } = props;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  } else {
    return <DefaultNormalArrayFieldTemplate {...props} />;
  }
};

type ArrayFieldTitleProps = {
  TitleField: any;
  idSchema: IdSchema;
  title: string;
  required: boolean;
};

const ArrayFieldTitle = ({ TitleField, idSchema, title, required }: ArrayFieldTitleProps) => {
  if (!title) {
    return null;
  }

  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
};

type ArrayFieldDescriptionProps = {
  DescriptionField: any;
  idSchema: IdSchema;
  description: string;
};

const ArrayFieldDescription = ({ DescriptionField, idSchema, description }: ArrayFieldDescriptionProps) => {
  if (!description) {
    return null;
  }

  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
};

// Used in the two templates
const DefaultArrayItem = (props: any) => {
  const { ArrowDownwardIcon, ArrowUpwardIcon, Box, Grid, IconButton, Paper, RemoveIcon } = useMuiComponent();
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
    minWidth: 0,
  };
  return (
    <Grid container={true} key={props.key} alignItems="center">
      <Grid item={true} xs style={{ overflow: 'auto' }}>
        <Box mb={2}>
          <Paper elevation={2}>
            <Box p={2}>{props.children}</Box>
          </Paper>
        </Box>
      </Grid>

      {props.hasToolbar && (
        <Grid item={true}>
          {(props.hasMoveUp || props.hasMoveDown) && (
            <IconButton
              size="small"
              className="array-item-move-up"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.disabled || props.readonly || !props.hasMoveUp}
              onClick={props.onReorderClick(props.index, props.index - 1)}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}

          {(props.hasMoveUp || props.hasMoveDown) && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.disabled || props.readonly || !props.hasMoveDown}
              onClick={props.onReorderClick(props.index, props.index + 1)}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          )}

          {props.hasRemove && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.disabled || props.readonly}
              onClick={props.onDropIndexClick(props.index)}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          )}
        </Grid>
      )}
    </Grid>
  );
};

const DefaultFixedArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.uiSchema['ui:title'] || props.title}
        required={props.required}
      />

      {(props.uiSchema['ui:description'] || props.schema.description) && (
        <div className="field-description" key={`field-description-${props.idSchema.$id}`}>
          {props.uiSchema['ui:description'] || props.schema.description}
        </div>
      )}

      <div className="row array-item-list" key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map(DefaultArrayItem)}
      </div>

      {props.canAdd && (
        <AddButton
          className="array-item-add"
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
};

const DefaultNormalArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { Box, Grid, Paper } = useMuiComponent();
  return (
    <Paper elevation={2}>
      <Box p={2}>
        <ArrayFieldTitle
          key={`array-field-title-${props.idSchema.$id}`}
          TitleField={props.TitleField}
          idSchema={props.idSchema}
          title={props.uiSchema['ui:title'] || props.title}
          required={props.required}
        />

        {(props.uiSchema['ui:description'] || props.schema.description) && (
          <ArrayFieldDescription
            key={`array-field-description-${props.idSchema.$id}`}
            DescriptionField={props.DescriptionField}
            idSchema={props.idSchema}
            description={props.uiSchema['ui:description'] || props.schema.description}
          />
        )}

        <Grid container={true} key={`array-item-list-${props.idSchema.$id}`}>
          {props.items && props.items.map(p => DefaultArrayItem(p))}

          {props.canAdd && (
            <Grid container justifyContent="flex-end">
              <Grid item={true}>
                <Box mt={2}>
                  <AddButton
                    className="array-item-add"
                    onClick={props.onAddClick}
                    disabled={props.disabled || props.readonly}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default ArrayFieldTemplate;
