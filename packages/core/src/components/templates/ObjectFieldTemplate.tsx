import React from "react";
import {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  canExpand,
  getTemplate,
  getUiOptions,
} from "@rjsf/utils";

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
  const options = getUiOptions<T, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, F>(
    "TitleFieldTemplate",
    registry,
    options
  );
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    F
  >("DescriptionFieldTemplate", registry, options);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <fieldset id={idSchema.$id}>
      {(options.title || title) && (
        <TitleFieldTemplate
          id={`${idSchema.$id}__title`}
          title={options.title || title}
          required={required}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(options.description || description) && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}__description`}
          description={options.description || description!}
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
