import Box, { BoxProps } from '@mui/material/Box';
import Divider, { DividerProps } from '@mui/material/Divider';
import Grid, { GridProps } from '@mui/material/Grid';
import Typography, { TypographyProps } from '@mui/material/Typography';
import {
  FormContextType,
  GenericObjectType,
  TitleFieldProps,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the TitleField. */
export interface TitleFieldMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the TitleField. */
  rjsfSlotProps?: {
    /** Props applied to the `Box` wrapper. */
    titleBox?: BoxProps;
    /** Props applied to the `Divider` element. */
    titleDivider?: DividerProps;
    /** Props applied to the `Typography` element used for the title. */
    titleTypography?: TypographyProps;
    /** Props applied to the `Grid` container used when `optionalDataControl` is present. */
    titleGridContainer?: GridProps;
    /** Props applied to the `Grid` item containing the title. */
    titleGridItem?: GridProps;
    /** Props applied to the `Grid` item containing the `optionalDataControl`. */
    titleOptionalDataGridItem?: GridProps;
  };
}

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>,
) {
  const { id, title, optionalDataControl, uiSchema } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, TitleFieldMuiProps>(uiOptions);

  let heading = (
    <Typography variant='h5' {...muiSlotProps?.titleTypography}>
      {title}
    </Typography>
  );
  if (optionalDataControl) {
    heading = (
      <Grid container={true} spacing={0} {...muiSlotProps?.titleGridContainer}>
        <Grid size='grow' {...muiSlotProps?.titleGridItem}>
          {heading}
        </Grid>
        <Grid justifyContent='flex-end' {...muiSlotProps?.titleOptionalDataGridItem}>
          {optionalDataControl}
        </Grid>
      </Grid>
    );
  }
  return (
    <Box id={id} mb={1} mt={1} {...muiSlotProps?.titleBox}>
      {heading}
      <Divider {...muiSlotProps?.titleDivider} />
    </Box>
  );
}
