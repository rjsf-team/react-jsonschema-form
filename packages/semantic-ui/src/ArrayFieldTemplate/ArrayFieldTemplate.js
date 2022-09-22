/* eslint-disable react/prop-types,react/destructuring-assignment */
import React from "react";
import { getTemplate, getUiOptions, isFixedItems } from "@rjsf/utils";

import { cleanClassNames, getSemanticProps } from "../util";

function ArrayFieldTemplate({
  uiSchema,
  idSchema,
  canAdd,
  className,
  classNames,
  disabled,
  formContext,
  items,
  onAddClick,
  options,
  readOnly,
  required,
  schema,
  title,
  registry,
}) {
  const semanticProps = getSemanticProps({
    options,
    uiSchema,
    formContext,
    defaultSchemaProps: { horizontalButtons: false, wrapItem: false },
  });
  const { horizontalButtons, wrapItem } = semanticProps;
  const itemProps = { horizontalButtons, wrapItem };
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const fieldTitle = uiOptions.title || title;
  const fieldDescription = uiOptions.description || schema.description;
  return (
    <div
      className={cleanClassNames([
        className,
        classNames,
        isFixedItems(schema) ? "" : "sortable-form-fields",
      ])}
    >
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={fieldTitle}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      {fieldDescription && (
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={fieldDescription}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div key={`array-item-list-${idSchema.$id}`}>
        <div className="row array-item-list">
          {items &&
            items.map((props) => (
              <ArrayFieldItemTemplate {...props} {...itemProps} />
            ))}
        </div>
        {canAdd && (
          <div
            style={{
              marginTop: "1rem",
              position: "relative",
              textAlign: "right",
            }}
          >
            <AddButton
              onClick={onAddClick}
              disabled={disabled || readOnly}
              uiSchema={uiSchema}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ArrayFieldTemplate;
