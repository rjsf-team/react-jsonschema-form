import React from "react";
import { ObjectFieldTemplateProps } from "@rjsf/utils";
import { Grid } from "semantic-ui-react";
import { canExpand, getTemplate, getUiOptions } from "@rjsf/utils";

function ObjectFieldTemplate({
  description,
  onAddClick,
  title,
  properties,
  disabled,
  readonly,
  required,
  uiSchema,
  schema,
  formData,
  idSchema,
  registry,
}: ObjectFieldTemplateProps) {
  const uiOptions = getUiOptions(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate">(
    "TitleFieldTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<"DescriptionFieldTemplate">(
    "DescriptionFieldTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const fieldTitle = uiOptions.title || title;
  const fieldDescription = uiOptions.description || description;
  return (
    <React.Fragment>
      {fieldTitle && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={fieldTitle}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {fieldDescription && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          description={fieldDescription}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {properties.map((prop) => prop.content)}
      {canExpand(schema, uiSchema, formData) && (
        <Grid.Column width={16} verticalAlign="middle">
          <Grid.Row>
            <div
              style={{
                marginTop: "1rem",
                position: "relative",
                textAlign: "right",
              }}
            >
              <AddButton
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </div>
          </Grid.Row>
        </Grid.Column>
      )}
    </React.Fragment>
  );
}

export default ObjectFieldTemplate;
