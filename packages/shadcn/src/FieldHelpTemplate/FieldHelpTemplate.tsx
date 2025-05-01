import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';

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
  const { idSchema, help, hasErrors } = props;
  if (!help) {
    return null;
  }
  const id = helpId<T>(idSchema);
  return (
    <span className={cn('text-xs font-medium text-muted-foreground', { ' text-destructive': hasErrors })} id={id}>
      {help}
    </span>
  );
}
