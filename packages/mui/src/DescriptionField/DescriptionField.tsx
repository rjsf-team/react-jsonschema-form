import Typography from '@mui/material/Typography';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { RichDescription } from '@rjsf/core';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  if (description) {
    return (
      <Typography id={id} variant='subtitle2' style={{ marginTop: '5px' }}>
        <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
      </Typography>
    );
  }

  return null;
}
