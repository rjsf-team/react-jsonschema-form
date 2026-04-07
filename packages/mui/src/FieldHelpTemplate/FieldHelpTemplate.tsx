import { RichHelp } from '@rjsf/core';
import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
import FormHelperText, { FormHelperTextProps } from '@mui/material/FormHelperText';
import { getMuiProps } from '../util';

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

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F, FormHelperTextProps>(uiOptions);

  return (
    <FormHelperText component='div' id={helpId(fieldPathId)} style={{ marginTop: '5px' }} {...muiProps}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </FormHelperText>
  );
}
