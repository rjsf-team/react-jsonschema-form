import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Box, List } from '@mantine/core';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors, idSchema }: FieldErrorProps<T, S, F>) {
  if (!errors || !errors.length) {
    return null;
  }
  // In mantine, errors are handled directly in each component, so there is no need to render a separate error template.
  const id = errorId<T>(idSchema);
  return (
    <Box id={id} c='red' display='none'>
      <List>
        {errors.map((error, index) => (
          <List.Item key={`field-error-${index}`}>{error}</List.Item>
        ))}
      </List>
    </Box>
  );
}
