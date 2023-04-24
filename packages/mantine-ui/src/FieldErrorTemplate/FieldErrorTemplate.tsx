import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { nanoid } from 'nanoid';

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

  const id = errorId<T>(idSchema);
  return (
    <Box component='label' id={id} color='red'>
      <List type='unordered'>
        {errors.map((error) => (
          <List.Item key={nanoid()}>{error}</List.Item>
        ))}
      </List>
    </Box>
  );
}
