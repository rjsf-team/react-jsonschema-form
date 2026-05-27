import Typography, { TypographyProps } from '@mui/material/Typography';
import { RichDescription } from '@rjsf/core';
import {
  DescriptionFieldProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';

import { computeSxProps, getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the DescriptionField. */
export interface DescriptionFieldMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the DescriptionField. */
  rjsfSlotProps?: {
    /** Props applied to the `Typography` element used for the description. */
    descTypography?: TypographyProps;
  };
}

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

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { rjsfSlotProps: { descTypography } = {} } = getMuiProps<T, S, F, DescriptionFieldMuiProps>(uiOptions);

  if (description) {
    return (
      <Typography
        id={id}
        variant='subtitle2'
        {...descTypography}
        sx={computeSxProps<TypographyProps>({ mt: 0.625 }, descTypography)}
      >
        <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
      </Typography>
    );
  }

  return null;
}
