import Box, { BoxProps } from '@mui/material/Box';
import Grid, { GridProps } from '@mui/material/Grid';
import Paper, { PaperProps } from '@mui/material/Paper';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
  GenericObjectType,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the ArrayFieldTemplate. */
export interface ArrayFieldTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the ArrayFieldTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the wrapper `Paper` material. */
    arrayPaper?: PaperProps;
    /** Props applied to the primary `Box` container. */
    arrayBox?: BoxProps;
    /** Props applied to the wrapper `Grid` container next to the Add Button. */
    arrayAddButtonGridContainer?: GridProps;
    /** Props applied to the `Grid` item containing the Add Button. */
    arrayAddButtonGridItem?: GridProps;
    /** Props applied to the `Box` containing the Add Button. */
    arrayAddButtonBox?: BoxProps;
  };
}

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateProps` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    disabled,
    fieldPathId,
    uiSchema,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, ArrayFieldTemplateMuiProps>(uiOptions);

  return (
    <Paper elevation={2} {...muiSlotProps?.arrayPaper}>
      <Box p={2} {...muiSlotProps?.arrayBox}>
        <ArrayFieldTitleTemplate
          fieldPathId={fieldPathId}
          title={uiOptions.title || title}
          schema={schema}
          uiSchema={uiSchema}
          required={required}
          registry={registry}
          optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
        />
        <ArrayFieldDescriptionTemplate
          fieldPathId={fieldPathId}
          description={uiOptions.description || schema.description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {items}
        {canAdd && (
          <Grid container justifyContent='flex-end' {...muiSlotProps?.arrayAddButtonGridContainer}>
            <Grid {...muiSlotProps?.arrayAddButtonGridItem}>
              <Box mt={2} {...muiSlotProps?.arrayAddButtonBox}>
                <AddButton
                  id={buttonId(fieldPathId, 'add')}
                  className='rjsf-array-item-add'
                  onClick={onAddClick}
                  disabled={disabled || readonly}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Paper>
  );
}
