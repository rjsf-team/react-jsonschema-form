import Box, { BoxProps } from '@mui/material/Box';
import Divider, { DividerProps } from '@mui/material/Divider';
import Grid, { GridProps } from '@mui/material/Grid';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
import { getMuiProps } from '../util';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>,
) {
  const { id, title, optionalDataControl, uiSchema, registry } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  let heading = (
    <Typography variant='h5' {...(otherMuiProps as TypographyProps)} {...(muiSlotProps?.typography as TypographyProps)}>
      {title}
    </Typography>
  );
  if (optionalDataControl) {
    heading = (
      <Grid container={true} spacing={0} {...(muiSlotProps?.grid as GridProps)}>
        <Grid size='grow' {...(muiSlotProps?.grid as GridProps)}>
          {heading}
        </Grid>
        <Grid justifyContent='flex-end' {...(muiSlotProps?.grid as GridProps)}>
          {optionalDataControl}
        </Grid>
      </Grid>
    );
  }
  return (
    <Box id={id} mb={1} mt={1} {...(muiSlotProps?.box as BoxProps)}>
      {heading}
      <Divider {...(muiSlotProps?.divider as DividerProps)} />
    </Box>
  );
}
