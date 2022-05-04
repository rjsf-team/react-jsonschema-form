import React, { useMemo } from "react";

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
const DefaultArrayItem = ({
  index, readonly, disabled, children, hasToolbar, hasRemove, hasMoveUp, hasMoveDown, onReorderClick, onDropIndexClick
}: any) => {

  const onRemoveClick = useMemo(() => onDropIndexClick(index), [index, onDropIndexClick]);

  const onArrowUpClick = useMemo(() => onReorderClick(index, index - 1), [index, onReorderClick]);

  const onArrowDownClick = useMemo(() => onReorderClick(index, index + 1), [index, onReorderClick]);

  return (
    <HStack alignItems={"flex-end"} py={1}>
      <Box w="100%">
        {children}
      </Box>

      {hasToolbar && (
        <Box>
          <ButtonGroup isAttached mb={1}>
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-up"
                tabIndex={-1}
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onArrowUpClick}
              />
            )}

            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-down"
                tabIndex={-1}
                disabled={
                  disabled || readonly || !hasMoveDown
                }
                onClick={onArrowDownClick}
              />
            )}

            {hasRemove && (
              <IconButton
                icon="remove"
                tabIndex={-1}
                disabled={disabled || readonly}
                onClick={onRemoveClick}
              />
            )}
          </ButtonGroup>
        </Box>
      )}
    </HStack>
  );
};

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
      {props.items && props.items.map((p) => {
        const { key, ...itemProps } = p;
        return <DefaultArrayItem key={key} {...itemProps}></DefaultArrayItem>;
      })}
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

    <Grid key={`array-item-list-${props.idSchema.$id}`}>
      <GridItem>
        {props.items.length > 0 && props.items.map((p) => {
          const { key, ...itemProps } = p;
          return <DefaultArrayItem key={key} {...itemProps}></DefaultArrayItem>;
        })}
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
