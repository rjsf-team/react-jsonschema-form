import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { RichHelp } from '@rjsf/core';
import Typography from '@mui/material/Typography';

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
    <Typography id={helpId(fieldPathId)} variant='caption' style={{ marginTop: '5px' }}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </Typography>
  );
}
