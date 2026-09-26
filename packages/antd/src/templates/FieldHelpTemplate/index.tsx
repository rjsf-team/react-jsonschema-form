import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import { theme } from 'antd';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { id, help, hasErrors, uiSchema, registry } = props;
  const { token } = theme.useToken();
  if (!help) {
    return null;
  }

  // `FieldTemplate` renders this inside `Form.Item`'s `help` slot, which antd tints as an error whenever the field has
  // one, so only then pin the description color to keep help text from reading as a second error message. Leaving the
  // color alone otherwise keeps a consumer's own `.help-block` or `styles.helpItem` styling in charge.
  return (
    <div id={helpId(id)} className='help-block' style={hasErrors ? { color: token.colorTextDescription } : undefined}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
