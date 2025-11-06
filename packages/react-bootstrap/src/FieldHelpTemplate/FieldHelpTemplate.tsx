import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';
import { RichHelp } from '@rjsf/core';
import Form from 'react-bootstrap/Form';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema, registry } = props;
  if (!help) {
    return null;
  }
  return (
    <div>
      <Form.Text id={helpId(fieldPathId)} className='text-muted'>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </Form.Text>
    </div>
  );
}
