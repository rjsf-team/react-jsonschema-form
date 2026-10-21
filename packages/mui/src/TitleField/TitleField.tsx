import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { DividerProps } from '@mui/material/Divider';
import Divider from '@mui/material/Divider';
import type { GridProps } from '@mui/material/Grid';
import Grid from '@mui/material/Grid';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import type { FormContextType, GenericObjectType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getUiOptions } from '@rjsf/utils';

import { computeSxProps, getMuiProps } from '../util.ts';

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

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data
 * control aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, required, optionalDataControl, uiSchema, registry } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const {
    rjsfSlotProps: {
      titleBox,
      titleDivider,
      titleTypography,
      titleGridContainer,
      titleGridItem,
      titleOptionalDataGridItem,
    } = {},
  } = getMuiProps<T, S, F, TitleFieldMuiProps>(uiOptions);

  let heading = (
    <Typography variant='h5' {...titleTypography}>
      <span id={id}>{title}</span>
      {/* Spaced by a thin space, as MUI's `FormLabel` spaces its own required marker */}
      {required && <span aria-hidden>{'\u2009*'}</span>}
    </Typography>
  );
  if (optionalDataControl) {
    heading = (
      <Grid container spacing={0} {...titleGridContainer}>
        <Grid size='grow' {...titleGridItem}>
          {heading}
        </Grid>
        <Grid
          {...titleOptionalDataGridItem}
          sx={computeSxProps<GridProps>({ justifyContent: 'flex-end' }, titleOptionalDataGridItem)}
        >
          {optionalDataControl}
        </Grid>
      </Grid>
    );
  }
  return (
    <Box {...titleBox} sx={computeSxProps<BoxProps>({ mb: 1, mt: 1 }, titleBox)}>
      {heading}
      <Divider {...titleDivider} />
    </Box>
  );
}
