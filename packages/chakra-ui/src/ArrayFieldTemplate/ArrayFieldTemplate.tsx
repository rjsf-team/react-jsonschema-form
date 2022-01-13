import React from "react";

import { utils } from "@rjsf/core";

import { Box, Grid, GridItem, ButtonGroup, HStack } from "@chakra-ui/react";

import { ArrayFieldTemplateProps, IdSchema } from "@rjsf/core";

import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";

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

const ArrayFieldTitle = ({
  TitleField,
  idSchema,
  title,
  required,
}: ArrayFieldTitleProps) => {
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

const ArrayFieldDescription = ({
  DescriptionField,
  idSchema,
  description,
}: ArrayFieldDescriptionProps) => {
  if (!description) {
    return null;
  }

  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
};

// Used in the two templates
const DefaultArrayItem = (props: any) => (
  <HStack key={props.key} alignItems={"flex-end"}>
    <Box p={2} w="100%">
      {props.children}
    </Box>

    {props.hasToolbar && (
      <Box p={2}>
        <ButtonGroup isAttached>
          {(props.hasMoveUp || props.hasMoveDown) && (
            <IconButton
              icon="arrow-up"
              tabIndex={-1}
              disabled={props.disabled || props.readonly || !props.hasMoveUp}
              onClick={props.onReorderClick(props.index, props.index - 1)}
            />
          )}

          {(props.hasMoveUp || props.hasMoveDown) && (
            <IconButton
              icon="arrow-down"
              tabIndex={-1}
              disabled={props.disabled || props.readonly || !props.hasMoveDown}
              onClick={props.onReorderClick(props.index, props.index + 1)}
            />
          )}

          {props.hasRemove && (
            <IconButton
              icon="remove"
              tabIndex={-1}
              disabled={props.disabled || props.readonly}
              onClick={props.onDropIndexClick(props.index)}
            />
          )}
        </ButtonGroup>
      </Box>
    )}
  </HStack>
);

const DefaultFixedArrayFieldTemplate = (props: ArrayFieldTemplateProps) => (
  <fieldset className={props.className}>
    <ArrayFieldTitle
      key={`array-field-title-${props.idSchema.$id}`}
      TitleField={props.TitleField}
      idSchema={props.idSchema}
      title={props.uiSchema["ui:title"] || props.title}
      required={props.required}
    />

    {(props.uiSchema["ui:description"] || props.schema.description) && (
      // Use DescriptionField if possible
      <div
        className="field-description"
        key={`field-description-${props.idSchema.$id}`}
      >
        {props.uiSchema["ui:description"] || props.schema.description}
      </div>
    )}

    <div
      className="row array-item-list"
      key={`array-item-list-${props.idSchema.$id}`}
    >
      {props.items && props.items.map(DefaultArrayItem)}
    </div>

    {props.canAdd && (
      <AddButton
        justifySelf={"flex-end"}
        className="array-item-add"
        onClick={props.onAddClick}
        disabled={props.disabled || props.readonly}
      />
    )}
  </fieldset>
);

const DefaultNormalArrayFieldTemplate = (props: ArrayFieldTemplateProps) => (
  <Box>
    <ArrayFieldTitle
      key={`array-field-title-${props.idSchema.$id}`}
      TitleField={props.TitleField}
      idSchema={props.idSchema}
      title={props.uiSchema["ui:title"] || props.title}
      required={props.required}
    />

    {(props.uiSchema["ui:description"] || props.schema.description) && (
      <ArrayFieldDescription
        key={`array-field-description-${props.idSchema.$id}`}
        DescriptionField={props.DescriptionField}
        idSchema={props.idSchema}
        description={
          props.uiSchema["ui:description"] || props.schema.description
        }
      />
    )}

    <Grid container={true} key={`array-item-list-${props.idSchema.$id}`}>
      <GridItem>
        {props.items.length > 0 && props.items.map(p => DefaultArrayItem(p))}
      </GridItem>
      {props.canAdd && (
        <GridItem justifySelf={"flex-end"}>
          <Box mt={2}>
            <AddButton
              className="array-item-add"
              onClick={props.onAddClick}
              disabled={props.disabled || props.readonly}
            />
          </Box>
        </GridItem>
      )}
    </Grid>
  </Box>
);

export default ArrayFieldTemplate;
