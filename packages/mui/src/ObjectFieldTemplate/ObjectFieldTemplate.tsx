import Grid, { GridProps } from '@mui/material/Grid';
import {
  FormContextType,
  GenericObjectType,
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
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the ObjectFieldTemplate. */
export interface ObjectFieldTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the ObjectFieldTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the outermost `Grid` container wrapping all object properties. */
    objectGridContainer?: GridProps;
    /** Props applied to the `Grid` item wrapping each individual object property. */
    objectGridItem?: GridProps;
    /** Props applied to the wrapper `Grid` container next to the Add Button (when expandable). */
    objectAddButtonGridContainer?: GridProps;
    /** Props applied to the `Grid` item containing the Add Button. */
    objectAddButtonGridItem?: GridProps;
  };
}

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

  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, ObjectFieldTemplateMuiProps>(uiOptions);

  return (
    <>
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
      <Grid container spacing={2} style={{ marginTop: '10px' }} {...muiSlotProps?.objectGridContainer}>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element, index) =>
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <Grid size={{ xs: 12 }} key={index} style={{ marginBottom: '10px' }} {...muiSlotProps?.objectGridItem}>
              {element.content}
            </Grid>
          ),
        )}
      </Grid>
      {canExpand<T, S, F>(schema, uiSchema, formData) && (
        <Grid container justifyContent='flex-end' {...muiSlotProps?.objectAddButtonGridContainer}>
          <Grid {...muiSlotProps?.objectAddButtonGridItem}>
            <AddButton
              id={buttonId(fieldPathId, 'add')}
              className='rjsf-object-property-expand'
              onClick={onAddProperty}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
}
