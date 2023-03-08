import ListItem from '@mui/material/ListItem';
import FormHelperText from '@mui/material/FormHelperText';
import List from '@mui/material/List';
import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <List dense={true} disablePadding={true}>
      {errors.map((error, i: number) => {
        return (
          <ListItem key={i} disableGutters={true}>
            <FormHelperText id={id}>{error}</FormHelperText>
          </ListItem>
        );
      })}
    </List>
  );
}
