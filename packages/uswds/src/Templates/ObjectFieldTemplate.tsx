import React from 'react';
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
  ObjectFieldTemplatePropertyType,
} from '@rjsf/utils';

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    idSchema,
    properties,
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

  const orderedPropertyNames = orderProperties(
    properties.map((prop: ObjectFieldTemplatePropertyType) => prop.name),
    uiSchema?.['ui:order']
  );

  return (
    <fieldset id={idSchema.$id} className="rjsf-object-fieldset">
      {(uiOptions.title || title) && (
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
          description={description as string | React.ReactElement}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className="rjsf-object-properties">
        {orderedPropertyNames.map((name, index) => {
          const property = properties.find((p: ObjectFieldTemplatePropertyType) => p.name === name);
          return property ? <React.Fragment key={`${name}-${index}`}>{property.content}</React.Fragment> : null;
        })}
      </div>
    </fieldset>
  );
}
