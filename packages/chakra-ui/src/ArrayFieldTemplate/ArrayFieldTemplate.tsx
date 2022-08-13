import { Box, Grid, GridItem } from "@chakra-ui/react";
import {
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
} from "@rjsf/utils";

import AddButton from "../AddButton";

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
  const {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTitleTemplate,
  } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
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
          registry={registry}
        />
      )}
      <Grid key={`array-item-list-${idSchema.$id}`}>
        <GridItem>
          {items.length > 0 &&
            items.map((itemProps: ArrayFieldTemplateItemType) => (
              <ArrayFieldItemTemplate {...itemProps} />
            ))}
        </GridItem>
        {canAdd && (
          <GridItem justifySelf={"flex-end"}>
            <Box mt={2}>
              <AddButton
                className="array-item-add"
                onClick={onAddClick}
                disabled={disabled || readonly}
              />
            </Box>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default ArrayFieldTemplate;
