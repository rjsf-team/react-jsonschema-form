import React from "react";
import {
  ObjectFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
  canExpand,
} from "@rjsf/utils";

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
const ObjectFieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: ObjectFieldTemplateProps<T, S, F>,
) => {
  const {
    description,
    disabled,
    formContext,
    formData,
    idSchema,
    onAddClick,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, S, F>(
    "TitleFieldTemplate",
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    S,
    F
  >("DescriptionFieldTemplate", registry, uiOptions);
  // ButtonTemplates are specified in the registry
  const { AddButton } = registry.templates.ButtonTemplates;

  return (
    <fieldset id={idSchema.$id} className="rjsf-uswds-object">
      {(uiOptions.title || title) && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-__title`}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(uiOptions.description || description) && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-__description`}
          description={uiOptions.description || description!}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          idSchema={idSchema}
        />
      )}
      {properties.map((element, index) =>
        // Remove the <div className="grid-row"> if you don't want each property to be wrapped in a grid row
        element.hidden ? (
          element.content
        ) : (
          <div className="grid-row grid-gap" key={index}>
            <div className="grid-col-12">{element.content}</div>
          </div>
        ),
      )}
      {canExpand<T, S, F>(schema, uiSchema, formData) && (
        <div className="grid-row">
          <div
            className="grid-col-12 margin-top-2 text-right"
          >
            <AddButton
              className="object-property-expand"
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
};

export default ObjectFieldTemplate;
