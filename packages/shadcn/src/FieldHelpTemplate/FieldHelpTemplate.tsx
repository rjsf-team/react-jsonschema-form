import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';

import { cn } from '../lib/utils';
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
  const { fieldPathId, help, hasErrors, registry, uiSchema } = props;
  if (!help) {
    return null;
  }
  const id = helpId(fieldPathId);
  return (
    <span className={cn('text-xs font-medium text-muted-foreground', { ' text-destructive': hasErrors })} id={id}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </span>
  );
}
