import { Message } from 'semantic-ui-react';
import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';
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
  const { fieldPathId, help, registry, uiSchema } = props;
  if (help) {
    const id = helpId(fieldPathId);
    return (
      <Message size='mini' info id={id} content={<RichHelp help={help} registry={registry} uiSchema={uiSchema} />} />
    );
  }
  return null;
}
