import { Box, List } from '@mantine/core';
import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { useErrorCopyId } from '../utils.tsx';

/** The `FieldErrorTemplate` component renders a hidden copy of the errors local to the particular field. Rendered by
 * the field's own `FieldTemplate`, it has the field's `errorId`, which the field's inputs are described by, and is the
 * one element with it: the error element a Mantine widget, or an object's or array's template, shows has none of the
 * field's then, see `useErrorElementId()`. A screen reader reads the errors once, and a custom widget or field that
 * shows no errors itself still has its inputs described by them.
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ errors, id }: FieldErrorProps<T, S, F>) {
  const copyId = useErrorCopyId(id);
  if (!errors?.length) {
    return null;
  }
  return (
    <Box id={copyId} c='red' display='none'>
      <List>
        {errors.map((error, index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <List.Item key={`field-error-${index}`}>{error}</List.Item>
        ))}
      </List>
    </Box>
  );
}
