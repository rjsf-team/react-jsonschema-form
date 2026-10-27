import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId, joinClassNames } from '@rjsf/utils';

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
    <div
      id={presentation?.help.id ?? helpId(id)}
      className={joinClassNames('rjsf-field-help', classMap.fieldHelp)}
      data-invalid={hasErrors || undefined}
    >
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
