import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId, getUiOptions } from '@rjsf/utils';
import Form from 'react-bootstrap/Form';
import { RichHelp } from '@rjsf/core';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, hasErrors, uiSchema = {}, registry } = props;
  if (!help) {
    return null;
  }
  const id = helpId(fieldPathId);
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry?.globalUiOptions);
  if (typeof help === 'string' && uiOptions.enableMarkdownInHelp) {
    return (
      <Form.Text className={hasErrors ? 'text-danger' : 'text-muted'} id={id}>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </Form.Text>
    );
  }
  return (
    <Form.Text className={hasErrors ? 'text-danger' : 'text-muted'} id={id}>
      {help}
    </Form.Text>
  );
}
