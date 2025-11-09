import { RichHelp } from '@rjsf/core';
import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import FormHelperText from '@mui/material/FormHelperText';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema, registry } = props;
  if (!help) {
    return null;
  }

  return (
    <FormHelperText component='div' id={helpId(fieldPathId)} style={{ marginTop: '5px' }}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </FormHelperText>
  );
}
