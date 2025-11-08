import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId, getUiOptions } from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';

import { cn } from '../lib/utils';

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
      <span className={cn('text-xs font-medium text-muted-foreground', { ' text-destructive': hasErrors })} id={id}>
        <Markdown options={{ disableParsingRawHTML: true }}>{help}</Markdown>
      </span>
    );
  }
  return (
    <span className={cn('text-xs font-medium text-muted-foreground', { ' text-destructive': hasErrors })} id={id}>
      {help}
    </span>
  );
}
