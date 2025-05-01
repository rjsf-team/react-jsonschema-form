import { CSSProperties } from 'react';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getUiOptions,
  getTemplate,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
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
  return (
    <Grid2 container={true} alignItems='center'>
      <Grid2 size='auto' style={{ overflow: 'auto' }}>
        <Box mb={2}>
          <Paper elevation={2}>
            <Box p={2}>{children}</Box>
          </Paper>
        </Box>
      </Grid2>
      {hasToolbar && (
        <Grid2>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
        </Grid2>
      )}
    </Grid2>
  );
}
