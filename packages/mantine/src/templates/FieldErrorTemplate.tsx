import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders nothing: each Mantine widget renders its errors through Mantine's own
 * error element, which is given the field's `errorId`, so a second copy would be read out twice or reference nothing
 *
 * @param _props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(_props: FieldErrorProps<T, S, F>) {
  return null;
}
