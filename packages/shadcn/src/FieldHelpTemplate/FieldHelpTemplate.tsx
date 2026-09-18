import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { id, help, uiSchema, registry, hasErrors } = props;
  if (!help) {
    return null;
  }

  return (
    <span
      className={cn('text-xs font-medium text-muted-foreground', { 'text-destructive': hasErrors })}
      id={helpId(id)}
    >
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </span>
  );
}
