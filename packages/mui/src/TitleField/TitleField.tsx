import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  let heading = <Typography variant='h5'>{title}</Typography>;
  if (optionalDataControl) {
    heading = (
      <Grid container={true} spacing={0}>
        <Grid size='grow'>{heading}</Grid>
        <Grid justifyContent='flex-end'>{optionalDataControl}</Grid>
      </Grid>
    );
  }
  return (
    <Box id={id} mb={1} mt={1}>
      {heading}
      <Divider />
    </Box>
  );
}
