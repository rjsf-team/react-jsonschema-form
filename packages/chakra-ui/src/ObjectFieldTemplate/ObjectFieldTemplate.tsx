import * as React from "react";

import { Grid, GridItem } from "@chakra-ui/react";

import { ObjectFieldTemplateProps } from "@rjsf/core";
import { utils } from "@rjsf/core";

import AddButton from "../AddButton";

const { canExpand } = utils;

const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const {
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
  } = props;

  return (
    <React.Fragment>
      {(uiSchema["ui:title"] || title) && (
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
      <Grid gap={2}>
        {properties.map((element, index) =>
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <GridItem key={index}>{element.content}</GridItem>
          )
        )}
        {canExpand(schema, uiSchema, formData) && (
          <GridItem justifySelf="flex-end">
            <AddButton
              className="object-property-expand"
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
            />
          </GridItem>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default ObjectFieldTemplate;
