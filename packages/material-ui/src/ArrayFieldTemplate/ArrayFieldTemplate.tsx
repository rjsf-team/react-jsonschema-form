import React from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  getUiOptions,
} from "@rjsf/utils";

import AddButton from "../AddButton/AddButton";

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
    <Paper elevation={2}>
      <Box p={2}>
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
        <Grid container={true} key={`array-item-list-${idSchema.$id}`}>
          {items &&
            items.map((itemProps: ArrayFieldTemplateItemType) => (
              <ArrayFieldItemTemplate {...itemProps} />
            ))}
          {canAdd && (
            <Grid container justifyContent="flex-end">
              <Grid item={true}>
                <Box mt={2}>
                  <AddButton
                    className="array-item-add"
                    onClick={onAddClick}
                    disabled={disabled || readonly}
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
