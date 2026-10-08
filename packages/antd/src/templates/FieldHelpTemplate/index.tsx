import type { ReactElement } from 'react';
import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import { theme } from 'antd';

/** Renders the help itself, so that `theme.useToken()` only subscribes the fields that have any. Its `help` is the one
 * `FieldHelpTemplate` has already found, so it is no longer optional.
 */
function HelpBlock<T, S extends StrictRJSFSchema, F extends FormContextType>({
  id,
  help,
  hasErrors,
  uiSchema,
  registry,
}: FieldHelpProps<T, S, F> & { help: string | ReactElement }) {
  const { token } = theme.useToken();

  // `FieldTemplate` renders this inside `Form.Item`'s `help` slot, which antd tints as an error whenever the field has
  // one — and help text shares the very element carrying the error text, so the tint would render it as a second error
  // message. Restating the description color is what overrides an inherited color, and it is deliberately the opposite
  // of the `hasErrors`-keyed danger tint `react-bootstrap` and `shadcn` apply, where help is its own element below the
  // field. It has to win over that tint, so it is an inline style, and a consumer restyling `.help-block`'s color needs
  // `!important` to take the error case back; `antd`'s own `Typography.Text` would give a class instead, but only by
  // wrapping help in a `<span>`, which cannot legally hold the block content that markdown or an element `ui:help` puts
  // in it
  return (
    <div id={helpId(id)} className='help-block' style={hasErrors ? { color: token.colorTextDescription } : undefined}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { help } = props;
  if (!help) {
    return null;
  }

  return <HelpBlock<T, S, F> {...props} help={help} />;
}
