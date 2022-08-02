import React from "react";
import {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  canExpand,
  getUiOptions,
} from "@rjsf/utils";
import AddButton from "../AddButton";

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
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
  const { DescriptionFieldTemplate, TitleFieldTemplate } = registry.templates;
  const options = getUiOptions(uiSchema);
  return (
    <fieldset id={idSchema.$id}>
      {(options.title || title) && (
        <TitleFieldTemplate
          id={`${idSchema.$id}__title`}
          title={options.title || title}
          required={required}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
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
