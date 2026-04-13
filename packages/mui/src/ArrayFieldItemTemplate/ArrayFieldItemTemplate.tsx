import { CSSProperties } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import Grid, { GridProps } from '@mui/material/Grid';
import Paper, { PaperProps } from '@mui/material/Paper';
import {
  ArrayFieldItemTemplateProps,
  FormContextType,
  getUiOptions,
  getTemplate,
  RJSFSchema,
  StrictRJSFSchema,
  GenericObjectType,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the ArrayFieldItemTemplate. */
export interface ArrayFieldItemTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the ArrayFieldItemTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the outermost `Grid` container. */
    arrayItemGridContainer?: GridProps;
    /** Props applied to the `Grid` item wrapping the item's content. */
    arrayItemGridItem?: GridProps;
    /** Props applied to the outer `Box` container. */
    arrayItemOuterBox?: BoxProps;
    /** Props applied to the `Paper` elevation component. */
    arrayItemPaper?: PaperProps;
    /** Props applied to the inner `Box` containing the actual children. */
    arrayItemInnerBox?: BoxProps;
    /** Props applied to the `Grid` containing the item's buttons. */
    arrayItemToolbarGrid?: GridProps;
  };
}

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, hasDescription, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
    minWidth: 0,
  };

  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, ArrayFieldItemTemplateMuiProps>(uiOptions);

  return (
    <Grid container={true} alignItems='center' {...muiSlotProps?.arrayItemGridContainer}>
      <Grid
        size={{ xs: 8, sm: 9, md: 10, lg: 11, xl: 11.25 }}
        style={{ overflow: 'auto' }}
        {...muiSlotProps?.arrayItemGridItem}
      >
        <Box mb={2} {...muiSlotProps?.arrayItemOuterBox}>
          <Paper elevation={2} {...muiSlotProps?.arrayItemPaper}>
            <Box p={2} {...muiSlotProps?.arrayItemInnerBox}>
              {children}
            </Box>
          </Paper>
        </Box>
      </Grid>
      {hasToolbar && (
        <Grid sx={{ mt: hasDescription ? -5 : -1.5 }} {...muiSlotProps?.arrayItemToolbarGrid}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
        </Grid>
      )}
    </Grid>
  );
}
