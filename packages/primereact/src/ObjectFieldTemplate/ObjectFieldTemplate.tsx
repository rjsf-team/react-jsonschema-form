import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
  buttonId,
} from '@rjsf/utils';

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
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
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <>
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
        <div style={{ marginBottom: '1rem' }}>
          <DescriptionFieldTemplate
            id={descriptionId<T>(idSchema)}
            description={description}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      )}
      {properties.map((prop) => prop.content)}
      {canExpand<T, S, F>(schema, uiSchema, formData) && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <AddButton
            id={buttonId<T>(idSchema, 'add')}
            className='rjsf-object-property-expand'
            icon='pi pi-plus'
            onClick={onAddClick(schema)}
            disabled={disabled || readonly}
            registry={registry}
          />
        </div>
      )}
    </>
  );
}
