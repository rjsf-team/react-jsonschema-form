import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import Typography from '@mui/joy/Typography';
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  return (
    <Box id={id} mb={1} mt={1}>
      <Typography level='h4'>{title}</Typography>
      <Divider />
    </Box>
  );
}
