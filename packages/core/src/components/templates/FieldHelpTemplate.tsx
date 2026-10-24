import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import { clsx } from 'clsx';

import RichHelp from '../RichHelp.tsx';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { id, help, uiSchema, registry, presentation, hasErrors } = props;
  const { classMap } = registry;
  if (!help) {
    return null;
  }

  return (
    <div id={presentation?.help.id ?? helpId(id)} className={clsx(classMap.fieldHelp, hasErrors && classMap.helpError)}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
