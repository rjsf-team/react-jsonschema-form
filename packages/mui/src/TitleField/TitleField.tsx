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

/** Properties available for the `slotProps` target of the TitleField. */
export interface TitleFieldMuiProps extends GenericObjectType {
  /** MUI subset property for targeting specific child elements. */
  slotProps?: {
    /** Props applied to the `Box` wrapper. */
    box?: BoxProps;
    /** Props applied to the `Divider` element. */
    divider?: DividerProps;
    /** Props applied to the `Typography` element used for the title. */
    typography?: TypographyProps;
    /** Props applied to the `Grid` container used when `optionalDataControl` is present. */
    gridContainer?: GridProps;
    /** Props applied to the `Grid` item containing the title. */
    gridItem?: GridProps;
    /** Props applied to the `Grid` item containing the `optionalDataControl`. */
    optionalDataGridItem?: GridProps;
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
  const muiProps = getMuiProps<T, S, F, TitleFieldMuiProps>(uiOptions);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  let heading = (
    <Typography variant='h5' {...muiSlotProps?.typography}>
      {title}
    </Typography>
  );
  if (optionalDataControl) {
    heading = (
      <Grid container={true} spacing={0} {...muiSlotProps?.gridContainer}>
        <Grid size='grow' {...muiSlotProps?.gridItem}>
          {heading}
        </Grid>
        <Grid justifyContent='flex-end' {...muiSlotProps?.optionalDataGridItem}>
          {optionalDataControl}
        </Grid>
      </Grid>
    );
  }
  return (
    <Box id={id} mb={1} mt={1} {...otherMuiProps} {...muiSlotProps?.box}>
      {heading}
      <Divider {...muiSlotProps?.divider} />
    </Box>
  );
}
