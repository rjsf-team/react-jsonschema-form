import React from 'react'; // Import React
import {
  ObjectFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
  orderProperties, // Import orderProperties
} from '@rjsf/utils';
// No Grid components typically needed here unless forcing a specific layout

/** The `ObjectFieldTemplate` is the template to use to render all the properties of an object field as identified by
 * the `SchemaField`. The properties are rendered using the `PropertyTemplate` template.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
// No changes needed in this template to handle if-then-else logic.
// This template renders the properties provided by @rjsf/core,
// which handles the resolution of conditional schemas.
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
    formContext,
    formData,
    idSchema,
    onAddClick, // Used for additionalProperties
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  // ButtonTemplates may be needed if using additionalProperties with add button
  // const { AddButton } = getTemplate<'ButtonTemplates', T, S, F>('ButtonTemplates', registry, uiOptions);

  // Use the original orderProperties utility with the potentially unfiltered ui:order
  const orderedProperties = orderProperties(properties, uiSchema?.['ui:order']);

  return (
    <>
      {(uiOptions.title || title) && ( // Render title if not empty
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(uiOptions.description || description) && ( // Render description if not empty
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {/* Render properties sequentially. FieldTemplate handles layout of individual fields. */}
      <div className="rjsf-object-properties">
        {orderedProperties.map((prop) => prop.content)}
      </div>
      {/* Logic for additionalProperties button if needed */}
      {/* {schema.additionalProperties && ( ... AddButton ... )} */}
    </>
  );
}
