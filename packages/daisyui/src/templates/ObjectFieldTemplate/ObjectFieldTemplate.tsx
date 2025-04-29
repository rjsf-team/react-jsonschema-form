import {
  canExpand,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
  buttonId,
} from '@rjsf/utils';

/** The `ObjectFieldTemplate` component renders a layout for object fields in the form
 * with DaisyUI styling. It handles:
 *
 * - Special styling for the root object with extra padding and shadows
 * - Rendering of title and description using appropriate templates
 * - Grid layout for object properties with consistent spacing
 * - Conditionally rendering an add button for expandable objects
 * - Support for hidden properties
 *
 * @param props - The `ObjectFieldTemplateProps` for the component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
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

  // Check if this is the root object
  const isRoot = idSchema.$id === 'root';

  return (
    <div className={`form-control ${isRoot ? 'bg-base-100 p-6 rounded-xl shadow-lg' : ''}`}>
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
      <div className={`grid grid-cols-1 gap-${description ? 3 : 4} ${isRoot ? '' : 'mb-4'}`}>
        {properties.map((element, index) =>
          element.hidden ? (
            element.content
          ) : (
            <div
              key={`${idSchema.$id}-${element.name}-${index}`}
              className={idSchema.$id === 'root' && element.name === 'tasks' ? 'mt-2' : ''}
            >
              {element.content}
            </div>
          ),
        )}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <div className='flex justify-end'>
            <AddButton
              id={buttonId<T>(idSchema, 'add')}
              className='rjsf-object-property-expand btn btn-primary btn-sm'
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        )}
      </div>
    </div>
  );
}
