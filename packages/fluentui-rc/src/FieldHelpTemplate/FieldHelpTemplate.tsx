import { Caption1 } from '@fluentui/react-components';
import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';

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
  return (
    <Caption1 id={helpId(fieldPathId)}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </Caption1>
  );
}
