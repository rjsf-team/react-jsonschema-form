import React from "react";
import {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  canExpand,
  getUiOptions,
} from "@rjsf/utils";
import AddButton from "../AddButton";

export default function ObjectFieldTemplate<T = any, F = any>(
  props: ObjectFieldTemplateProps<T, F>
) {
  const {
    description,
    disabled,
    formData,
    idSchema,
    onAddClick,
    properties,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const { TitleField, DescriptionField } = registry.templates;
  const options = getUiOptions(uiSchema);
  return (
    <fieldset id={idSchema.$id}>
      {(options.title || title) && (
        <TitleField
          id={`${idSchema.$id}__title`}
          title={options.title || title}
          required={required}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionField
          id={`${idSchema.$id}__description`}
          description={description}
          registry={registry}
        />
      )}
      {properties.map((prop: ObjectFieldTemplatePropertyType) => prop.content)}
      {canExpand(schema, uiSchema, formData) && (
        <AddButton
          className="object-property-expand"
          onClick={onAddClick(schema)}
          disabled={disabled || readonly}
        />
      )}
    </fieldset>
  );
}
