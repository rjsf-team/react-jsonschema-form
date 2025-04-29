import Grid2 from '@mui/material/Grid2';
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
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid2 container={true} spacing={2} style={{ marginTop: '10px' }}>
        {properties.map((element, index) =>
          // Remove the <Grid2> if the inner element is hidden as the <Grid2>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <Grid2 size={{ xs: 12 }} key={index} style={{ marginBottom: '10px' }}>
              {element.content}
            </Grid2>
          ),
        )}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <Grid2 container justifyContent='flex-end'>
            <Grid2>
              <AddButton
                id={buttonId<T>(idSchema, 'add')}
                className='rjsf-object-property-expand'
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid2>
          </Grid2>
        )}
      </Grid2>
    </>
  );
}
