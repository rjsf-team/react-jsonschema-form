import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
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
  if (!help) {
    return null;
  }
  const id = helpId(fieldPathId);
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry?.globalUiOptions);
  if (typeof help === 'string') {
    if (uiOptions.enableMarkdownInHelp) {
      return (
        <div id={id} className='help-block'>
          <Markdown options={{ disableParsingRawHTML: true }}>{help}</Markdown>
        </div>
      );
    }
    return (
      <p id={id} className='help-block'>
        {help}
      </p>
    );
  }
  return (
    <div id={id} className='help-block'>
      {help}
    </div>
  );
}
