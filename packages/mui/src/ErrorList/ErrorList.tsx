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
    paper?: PaperProps;
    /** Props applied to the `Box` container. */
    box?: BoxProps;
    /** Props applied to the `Typography` element for the title. */
    typography?: TypographyProps;
    /** Props applied to the `List` container holding the errors. */
    list?: ListProps;
    /** Props applied to each `ListItem` representing an error. */
    listItem?: ListItemProps;
    /** Props applied to each `ListItemIcon` representing the error icon. */
    listItemIcon?: ListItemIconProps;
    /** Props applied to each `ListItemText` representing the error message. */
    listItemText?: ListItemTextProps;
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
    <Paper elevation={2} {...muiSlotProps?.paper}>
      <Box mb={2} p={2} {...muiSlotProps?.box}>
        <Typography variant='h6' {...muiSlotProps?.typography}>
          {translateString(TranslatableString.ErrorsLabel)}
        </Typography>
        <List dense={true} {...muiSlotProps?.list}>
          {errors.map((error, i: number) => {
            return (
              <ListItem key={i} {...muiSlotProps?.listItem}>
                <ListItemIcon {...muiSlotProps?.listItemIcon}>
                  <ErrorIcon color='error' />
                </ListItemIcon>
                <ListItemText primary={error.stack} {...muiSlotProps?.listItemText} />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}
