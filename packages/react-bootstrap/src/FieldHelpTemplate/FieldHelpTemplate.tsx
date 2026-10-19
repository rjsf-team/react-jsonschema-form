import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

/** The `FieldHelpTemplate` component renders any help desired for a field, in a block element, since `RichHelp` can
 * render markdown blocks
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { id, help, uiSchema, registry, hasErrors, presentation } = props;
  if (!help) {
    return null;
  }
  return (
    <Form.Text as='div' id={presentation?.help.id ?? helpId(id)} className={hasErrors ? 'text-danger' : 'text-muted'}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </Form.Text>
  );
}
