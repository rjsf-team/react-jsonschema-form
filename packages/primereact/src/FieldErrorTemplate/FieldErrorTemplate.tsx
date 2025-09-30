import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Message } from 'primereact/message';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ errors, fieldPathId }: FieldErrorProps<T, S, F>) {
  if (errors && errors.length > 0) {
    const id = errorId(fieldPathId);
    const content = errors.map((error, i: number) => {
      return <div key={i}>{error}</div>;
    });

    return (
      <Message
        id={id}
        severity='error'
        style={{ justifyContent: 'left' }}
        text={content}
        pt={{ text: { style: { fontSize: 'smaller' } } }}
      />
    );
  }
  return null;
}
