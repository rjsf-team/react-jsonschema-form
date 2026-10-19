import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { renderErrors } from '../utils.tsx';

/** The `FieldErrorTemplate` component renders the errors local to the particular field that its field's plan leaves to
 * the template, such as those of a custom widget or field, an `anyOf`/`oneOf` field or an array rendered item by item,
 * in Mantine's own error element, as this theme's widgets render theirs, under the field's `errorId`
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ errors, id }: FieldErrorProps<T, S, F>) {
  return renderErrors(id, errors ?? []);
}
