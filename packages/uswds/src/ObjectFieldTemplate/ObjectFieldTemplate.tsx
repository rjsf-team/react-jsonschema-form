import React from 'react'; // Keep React import as Fragment is used
import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
  orderProperties,
  canExpand,
  descriptionId,
  titleId,
} from '@rjsf/utils';
import type { UiSchema } from '@rjsf/utils'; // Type-only import

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
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
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const orderedProperties = orderProperties(
    properties.map((prop) => prop.name),
    uiSchema?.['ui:order']
  );

  return (
    <fieldset id={idSchema.$id} className="rjsf-object-fieldset">
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className="rjsf-object-properties">
        {orderedProperties.map((name, index) => {
          const property = properties.find((p) => p.name === name);
          return property ? <React.Fragment key={`${name}-${index}`}>{property.content}</React.Fragment> : null;
        })}
      </div>
      {canExpand<T, S, F>(schema, uiSchema, formData) && (
        <AddButton
          className="object-property-expand"
          onClick={onAddClick(schema)}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  );
}

