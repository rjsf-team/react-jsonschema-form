import * as React from "react";

import { Grid, GridItem } from "@chakra-ui/react";

import { canExpand, getUiOptions, ObjectFieldTemplateProps } from "@rjsf/utils";

import AddButton from "../AddButton";

const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const {
    description,
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
    registry,
  } = props;
  const { DescriptionField, TitleField } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);

  return (
    <React.Fragment>
      {(uiOptions.title || title) && (
        <TitleField
          id={`${idSchema.$id}-title`}
          title={uiOptions.title || title}
          required={required}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionField
          id={`${idSchema.$id}-description`}
          description={description}
          registry={registry}
        />
      )}
      <Grid gap={description ? 2 : 6} mb={4}>
        {properties.map((element, index) =>
          element.hidden ? (
            element.content
          ) : (
            <GridItem key={`${idSchema.$id}-${element.name}-${index}`}>
              {element.content}
            </GridItem>
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
