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
    fieldPathId,
    schema,
    formData,
    optionalDataControl,
    onAddProperty,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  // Check if this is the root object
  const isRoot = fieldPathId.$id === 'root';

  return (
    <div className={`form-control ${isRoot ? 'bg-base-100 p-6 rounded-xl shadow-lg' : ''}`}>
      {title && (
        <TitleFieldTemplate
          id={titleId(fieldPathId)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId(fieldPathId)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className={`grid grid-cols-1 gap-${description ? 3 : 4} ${isRoot ? '' : 'mb-4'}`}>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element, index) =>
          element.hidden ? (
            element.content
          ) : (
            <div
              key={`${fieldPathId.$id}-${element.name}-${index}`}
              className={fieldPathId.$id === 'root' && element.name === 'tasks' ? 'mt-2' : ''}
            >
              {element.content}
            </div>
          ),
        )}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <div className='flex justify-end'>
            <AddButton
              id={buttonId(fieldPathId, 'add')}
              className='rjsf-object-property-expand btn btn-primary btn-sm'
              onClick={onAddProperty}
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
