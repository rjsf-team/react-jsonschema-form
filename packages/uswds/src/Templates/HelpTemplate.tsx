import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Alert } from '@trussworks/react-uswds';

/** The `HelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function HelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { help, idSchema } = props;
  if (!help) {
    return null;
  }
  const id = `${idSchema.$id}__help`;
  return (
    <Alert
      id={id}
      type="info"
      headingLevel="h4"
      slim={true}
      role="tooltip"
      className="margin-top-1"
    >
      {help}
    </Alert>
  );
}
