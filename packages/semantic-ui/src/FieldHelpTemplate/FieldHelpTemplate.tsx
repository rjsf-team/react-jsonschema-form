import { Message } from 'semantic-ui-react';
import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldHelpProps<T, S, F>) {
  const { idSchema, help } = props;
  if (help) {
    const id = helpId<T>(idSchema);
    return <Message size='mini' info id={id} content={help} />;
  }
  return null;
}
