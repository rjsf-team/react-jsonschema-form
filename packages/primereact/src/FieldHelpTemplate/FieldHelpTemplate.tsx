import { FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, helpId } from '@rjsf/utils';
import { RichHelp } from '@rjsf/core';

/** The [FieldHelpTemplate](cci:7://file:///Users/suyoghabbu/Desktop/opensource/json-schema/react-jsonschema-form/packages/Users/suyoghabbu/Desktop/opensource/json-schema/react-jsonschema-form/packages/mui/src/FieldHelpTemplate:0:0-0:0) component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema, registry } = props;
  if (help) {
    return (
      <small id={helpId(fieldPathId)}>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </small>
    );
  }
  return null;
}
