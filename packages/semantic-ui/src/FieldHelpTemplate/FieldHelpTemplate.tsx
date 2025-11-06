import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';
import { RichHelp } from '@rjsf/core';
import { Message } from 'semantic-ui-react';

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
  if (help) {
    return (
      <Message size='mini' info id={helpId(fieldPathId)}>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </Message>
    );
  }
  return null;
}
