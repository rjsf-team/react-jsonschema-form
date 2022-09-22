import React from "react";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
} from "@rjsf/utils";

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const {
    canAdd,
    disabled,
    idSchema,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate =
    getTemplate<"ArrayFieldDescriptionTemplate">(
      "ArrayFieldDescriptionTemplate",
      registry,
      uiOptions
    );
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate">(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate">(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <Box>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={(uiOptions.description || schema.description)!}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid key={`array-item-list-${idSchema.$id}`}>
        <GridItem>
          {items.length > 0 &&
            items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType) => (
              <ArrayFieldItemTemplate key={key} {...itemProps} />
            ))}
        </GridItem>
        {canAdd && (
          <GridItem justifySelf={"flex-end"}>
            <Box mt={2}>
              <AddButton
                className="array-item-add"
                onClick={onAddClick}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
              />
            </Box>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default ArrayFieldTemplate;
