import Grid, { GridProps } from '@mui/material/Grid';
import { FormContextType, GridTemplateProps, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Renders a `GridTemplate` for mui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: GridTemplateProps,
) {
  const { children, column, uiSchema, registry, ...rest } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry?.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Grid
      container={!column}
      {...(rest as GridProps)}
      {...(otherMuiProps as GridProps)}
      {...(muiSlotProps?.grid as GridProps)}
    >
      {children}
    </Grid>
  );
}
