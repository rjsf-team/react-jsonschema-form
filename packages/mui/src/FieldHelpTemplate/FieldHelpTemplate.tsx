import { RichHelp } from '@rjsf/core';
import {
  helpId,
  FieldHelpProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
  GenericObjectType,
} from '@rjsf/utils';
import FormHelperText, { FormHelperTextProps } from '@mui/material/FormHelperText';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the FieldHelpTemplate. */
export interface FieldHelpTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the FieldHelpTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the `FormHelperText` used for help text. */
    helpFormHelperText?: FormHelperTextProps;
  };
}

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
  const muiProps = getMuiProps<T, S, F, FieldHelpTemplateMuiProps>(uiOptions);
  const { rjsfSlotProps: muiSlotProps } = muiProps;

  return (
    <FormHelperText
      component='div'
      id={helpId(fieldPathId)}
      style={{ marginTop: '5px' }}
      {...muiSlotProps?.helpFormHelperText}
    >
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </FormHelperText>
  );
}
