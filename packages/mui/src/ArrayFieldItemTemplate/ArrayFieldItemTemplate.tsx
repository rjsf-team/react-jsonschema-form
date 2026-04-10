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

/** Properties available for the `slotProps` target of the ArrayFieldItemTemplate. */
export interface ArrayFieldItemTemplateMuiProps extends GenericObjectType {
  /** MUI subset property for targeting specific child elements. */
  slotProps?: {
    /** Props applied to the outermost `Grid` container. */
    gridContainer?: GridProps;
    /** Props applied to the `Grid` item wrapping the item's content. */
    gridItem?: GridProps;
    /** Props applied to the outer `Box` container. */
    outerBox?: BoxProps;
    /** Props applied to the `Paper` elevation component. */
    paper?: PaperProps;
    /** Props applied to the inner `Box` containing the actual children. */
    innerBox?: BoxProps;
    /** Props applied to the `Grid` containing the item's buttons. */
    toolbarGrid?: GridProps;
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

  const muiProps = getMuiProps<T, S, F, ArrayFieldItemTemplateMuiProps>(uiOptions);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Grid container={true} alignItems='center' {...otherMuiProps} {...muiSlotProps?.gridContainer}>
      <Grid size={{ xs: 8, sm: 9, md: 10, lg: 11, xl: 11.25 }} style={{ overflow: 'auto' }} {...muiSlotProps?.gridItem}>
        <Box mb={2} {...muiSlotProps?.outerBox}>
          <Paper elevation={2} {...muiSlotProps?.paper}>
            <Box p={2} {...muiSlotProps?.innerBox}>
              {children}
            </Box>
          </Paper>
        </Box>
      </Grid>
      {hasToolbar && (
        <Grid sx={{ mt: hasDescription ? -5 : -1.5 }} {...muiSlotProps?.toolbarGrid}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
        </Grid>
      )}
    </Grid>
  );
}
