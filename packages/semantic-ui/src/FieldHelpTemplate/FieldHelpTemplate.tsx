import { Message } from 'semantic-ui-react';
import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId, getUiOptions } from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema = {}, registry } = props;
  if (help) {
    const id = helpId(fieldPathId);
    const uiOptions = getUiOptions<T, S, F>(uiSchema, registry?.globalUiOptions);
    if (typeof help === 'string' && uiOptions.enableMarkdownInHelp) {
      return (
        <Message size='mini' info id={id}>
          <Markdown options={{ disableParsingRawHTML: true }}>{help}</Markdown>
        </Message>
      );
    }
    return <Message size='mini' info id={id} content={help} />;
  }
  return null;
}
