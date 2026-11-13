import { chakra, Fieldset } from '@chakra-ui/react';
import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], id: fieldId } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldId);

  // One element carries the id a control is described by, so the id appears once and describes every message
  return (
    <Fieldset.ErrorText mt={0} id={id} display='block'>
      {errors.map((error, i: number) => (
        // oxlint-disable-next-line react/no-array-index-key
        <chakra.span key={i} display='block'>
          {error}
        </chakra.span>
      ))}
    </Fieldset.ErrorText>
  );
}
