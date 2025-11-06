import { Caption1 } from '@fluentui/react-components';
import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
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
  const { fieldPathId, help, uiSchema = {}, registry } = props;
  if (!help) {
    return null;
  }
  const id = helpId(fieldPathId);
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry?.globalUiOptions);
  if (typeof help === 'string' && uiOptions.enableMarkdownInHelp) {
    return (
      <Caption1 id={id}>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </Caption1>
    );
  }
  return <Caption1 id={id}>{help}</Caption1>;
}
