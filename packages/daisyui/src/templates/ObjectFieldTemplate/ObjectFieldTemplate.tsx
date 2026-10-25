import type { FormContextType, ObjectFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  descriptionId,
  getTemplates,
  getUiOptions,
  titleId,
  buttonId,
  titleDrawsOptionalDataControl,
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    presentation,
    id,
    schema,
    formData,
    optionalDataControl,
    onAddProperty,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { TitleFieldTemplate, DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const showOptionalDataControlInTitle = titleDrawsOptionalDataControl<T, S, F>(props);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { schemaUtils } = registry;

  // Check if this is the root object
  const isRoot = id === 'root';

  return (
    <div className={`form-control ${isRoot ? 'bg-base-100 p-6 rounded-xl shadow-lg' : ''}`}>
      {title && (
        <TitleFieldTemplate
          id={titleId(id)}
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
          id={presentation?.description.id ?? descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className={`grid grid-cols-1 gap-${description ? 3 : 4} ${isRoot ? '' : 'mb-4'}`}>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element) =>
          element.hidden ? (
            element.content
          ) : (
            <div key={element.name} className={id === 'root' && element.name === 'tasks' ? 'mt-2' : ''}>
              {element.content}
            </div>
          ),
        )}
        {schemaUtils.canExpand(schema, uiSchema, formData) && (
          <div className='flex justify-end'>
            <AddButton
              id={buttonId(id, 'add')}
              className='rjsf-object-property-expand btn-primary'
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
