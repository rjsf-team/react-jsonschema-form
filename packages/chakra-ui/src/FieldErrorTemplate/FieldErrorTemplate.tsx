import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Fieldset } from '@chakra-ui/react';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], fieldPathId } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldPathId);

  return errors.map((error, i: number) => {
    return (
      <Fieldset.ErrorText mt={0} key={i} id={id}>
        {error}
      </Fieldset.ErrorText>
    );
  });
}
