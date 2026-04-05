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
} from '@rjsf/utils';
import { getMuiProps } from '../util';

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

  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Grid container={true} alignItems='center' {...(otherMuiProps as GridProps)} {...(muiSlotProps?.grid as GridProps)}>
      <Grid
        size={{ xs: 8, sm: 9, md: 10, lg: 11, xl: 11.25 }}
        style={{ overflow: 'auto' }}
        {...(muiSlotProps?.grid as GridProps)}
      >
        <Box mb={2} {...(muiSlotProps?.box as BoxProps)}>
          <Paper elevation={2} {...(muiSlotProps?.paper as PaperProps)}>
            <Box p={2} {...(muiSlotProps?.box as BoxProps)}>
              {children}
            </Box>
          </Paper>
        </Box>
      </Grid>
      {hasToolbar && (
        <Grid sx={{ mt: hasDescription ? -5 : -1.5 }} {...(muiSlotProps?.grid as GridProps)}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
        </Grid>
      )}
    </Grid>
  );
}
