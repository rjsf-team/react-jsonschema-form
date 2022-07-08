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
const DefaultArrayItem = (props: { extra: any }) => {
  const { ArrowDownwardIcon, ArrowUpwardIcon, Box, Grid, IconButton, Paper, RemoveIcon } = useMuiComponent();
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
    minWidth: 0,
  };
  return (
    <Grid container={true} key={props.extra.key} alignItems="center">
      <Grid item={true} xs style={{ overflow: 'auto' }}>
        <Box mb={2}>
          <Paper elevation={2}>
            <Box p={2}>{props.extra.children}</Box>
          </Paper>
        </Box>
      </Grid>

      {props.extra.hasToolbar && (
        <Grid item={true}>
          {(props.extra.hasMoveUp || props.extra.hasMoveDown) && (
            <IconButton
              size="small"
              className="array-item-move-up"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.extra.disabled || props.extra.readonly || !props.extra.hasMoveUp}
              onClick={props.extra.onReorderClick(props.extra.index, props.extra.index - 1)}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}

          {(props.extra.hasMoveUp || props.extra.hasMoveDown) && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.extra.disabled || props.extra.readonly || !props.extra.hasMoveDown}
              onClick={props.extra.onReorderClick(props.extra.index, props.extra.index + 1)}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          )}

          {props.extra.hasRemove && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={props.extra.disabled || props.extra.readonly}
              onClick={props.extra.onDropIndexClick(props.extra.index)}
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
        {props.items && props.items.map((p) => <DefaultArrayItem extra={p} key={p.key} />)}
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
          {props.items && props.items.map(p => <DefaultArrayItem extra={p} key={p.key} />)}

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
