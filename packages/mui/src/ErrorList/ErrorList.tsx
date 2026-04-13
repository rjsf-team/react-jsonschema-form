import ErrorIcon from '@mui/icons-material/Error';
import Box, { BoxProps } from '@mui/material/Box';
import List, { ListProps } from '@mui/material/List';
import ListItem, { ListItemProps } from '@mui/material/ListItem';
import ListItemIcon, { ListItemIconProps } from '@mui/material/ListItemIcon';
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText';
import Paper, { PaperProps } from '@mui/material/Paper';
import Typography, { TypographyProps } from '@mui/material/Typography';
import {
  ErrorListProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

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
  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, ErrorListMuiProps>(uiOptions);

  return (
    <Paper elevation={2} {...muiSlotProps?.errorPaper}>
      <Box mb={2} p={2} {...muiSlotProps?.errorBox}>
        <Typography variant='h6' {...muiSlotProps?.errorTypography}>
          {translateString(TranslatableString.ErrorsLabel)}
        </Typography>
        <List dense={true} {...muiSlotProps?.errorList}>
          {errors.map((error, i: number) => {
            return (
              <ListItem key={i} {...muiSlotProps?.errorListItem}>
                <ListItemIcon {...muiSlotProps?.errorListItemIcon}>
                  <ErrorIcon color='error' />
                </ListItemIcon>
                <ListItemText primary={error.stack} {...muiSlotProps?.errorListItemText} />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}
