import ErrorIcon from '@mui/icons-material/Error';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { ListProps } from '@mui/material/List';
import List from '@mui/material/List';
import type { ListItemProps } from '@mui/material/ListItem';
import ListItem from '@mui/material/ListItem';
import type { ListItemIconProps } from '@mui/material/ListItemIcon';
import ListItemIcon from '@mui/material/ListItemIcon';
import type { ListItemTextProps } from '@mui/material/ListItemText';
import ListItemText from '@mui/material/ListItemText';
import type { PaperProps } from '@mui/material/Paper';
import Paper from '@mui/material/Paper';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import type { ErrorListProps, FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString, getUiOptions } from '@rjsf/utils';

import { computeSxProps, getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the ErrorList. */
export interface ErrorListMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the ErrorList. */
  rjsfSlotProps?: {
    /** Props applied to the outermost `Paper` component. */
    errorPaper?: PaperProps;
    /** Props applied to the `Box` container. */
    errorBox?: BoxProps;
    /** Props applied to the `Typography` element for the title. */
    errorTypography?: TypographyProps;
    /** Props applied to the `List` container holding the errors. */
    errorList?: ListProps;
    /** Props applied to each `ListItem` representing an error. */
    errorListItem?: ListItemProps;
    /** Props applied to each `ListItemIcon` representing the error icon. */
    errorListItemIcon?: ListItemIconProps;
    /** Props applied to each `ListItemText` representing the error message. */
    errorListItemText?: ListItemTextProps;
  };
}

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
  uiSchema,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const {
    rjsfSlotProps: {
      errorPaper,
      errorBox,
      errorTypography,
      errorList,
      errorListItem,
      errorListItemIcon,
      errorListItemText,
    } = {},
  } = getMuiProps<T, S, F, ErrorListMuiProps>(uiOptions);

  return (
    <Paper elevation={2} {...errorPaper}>
      <Box {...errorBox} sx={computeSxProps<BoxProps>({ mb: 2, p: 2 }, errorBox)}>
        <Typography variant='h6' {...errorTypography}>
          {translateString(TranslatableString.ErrorsLabel)}
        </Typography>
        <List dense {...errorList}>
          {errors.map((error, i: number) => (
            // oxlint-disable-next-line react/no-array-index-key
            <ListItem key={i} {...errorListItem}>
              <ListItemIcon {...errorListItemIcon}>
                <ErrorIcon color='error' />
              </ListItemIcon>
              <ListItemText primary={error.stack} {...errorListItemText} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
}
