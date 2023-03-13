import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';
import Form from 'react-bootstrap/Form';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldHelpProps<T, S, F>) {
  const { idSchema, help, hasErrors } = props;
  if (!help) {
    return null;
  }
  const id = helpId<T>(idSchema);
  return (
    <Form.Text className={hasErrors ? 'text-danger' : 'text-muted'} id={id}>
      {help}
    </Form.Text>
  );
}
